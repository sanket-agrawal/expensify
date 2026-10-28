import type { IncomingMessage, ServerResponse } from 'node:http';
import { ZodError } from 'zod';
import { Db, ObjectId } from 'mongodb';
import { ApiError, validationError, notFoundError } from './errors';
import { getDb } from './db';
import type { Trip } from '@shared/schemas/trip';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface VercelRequest extends IncomingMessage {
  query: Record<string, string | string[]>;
  cookies: Record<string, string>;
  body: unknown;
}

export interface VercelResponse extends ServerResponse {
  status(statusCode: number): VercelResponse;
  json(data: unknown): void;
  send(data: unknown): void;
}

export type HandlerFn = (
  req: VercelRequest,
  res: VercelResponse,
  context: { db: Db }
) => Promise<unknown> | unknown;

/**
 * Parses request body if not already parsed by Vercel
 */
async function parseBody(req: VercelRequest): Promise<unknown> {
  if (req.body !== undefined && req.body !== null) {
    return req.body;
  }

  const contentType = (req.headers['content-type'] as string) || '';

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    });
    req.on('end', () => {
      const buffer = Buffer.concat(chunks);
      if (buffer.length === 0) {
        resolve({});
        return;
      }

      if (contentType.includes('application/json')) {
        try {
          resolve(JSON.parse(buffer.toString('utf8')));
        } catch {
          reject(validationError('Invalid JSON in request body'));
        }
        return;
      }

      // If image or binary stream, return the raw Buffer
      if (
        contentType.startsWith('image/') ||
        contentType === 'application/octet-stream' ||
        contentType.includes('multipart/')
      ) {
        resolve(buffer);
        return;
      }

      try {
        resolve(JSON.parse(buffer.toString('utf8')));
      } catch {
        resolve(buffer);
      }
    });
    req.on('error', (err) => reject(err));
  });
}

/**
 * Higher-order function that wraps API handlers with method enforcement,
 * db connection, error handling, and JSON serialization.
 */
export function createHandler(
  allowedMethods: HttpMethod[],
  handlerFn: HandlerFn
) {
  return async (req: VercelRequest, res: VercelResponse) => {
    // Enable CORS for Vercel functions if needed
    res.setHeader('Content-Type', 'application/json');

    const method = req.method as HttpMethod;
    if (!allowedMethods.includes(method)) {
      res.statusCode = 405;
      res.setHeader('Allow', allowedMethods.join(', '));
      res.end(
        JSON.stringify({
          error: {
            code: 'VALIDATION_ERROR',
            message: `Method ${method} not allowed. Supported methods: ${allowedMethods.join(', ')}`,
          },
        })
      );
      return;
    }

    try {
      // Ensure body is parsed for POST/PATCH/PUT
      if (['POST', 'PATCH', 'PUT'].includes(method)) {
        req.body = await parseBody(req);
      }

      const db = await getDb();
      const result = await handlerFn(req, res, { db });

      // If handler hasn't finished the response, write result as JSON
      if (!res.writableEnded) {
        res.statusCode = 200;
        res.end(JSON.stringify(result));
      }
    } catch (err: unknown) {
      if (res.writableEnded) return;

      if (err instanceof ApiError) {
        res.statusCode = err.statusCode;
        res.end(
          JSON.stringify({
            error: {
              code: err.code,
              message: err.message,
              ...(err.details ? { details: err.details } : {}),
            },
          })
        );
        return;
      }

      if (err instanceof ZodError) {
        const firstIssue = err.issues[0];
        const message = firstIssue
          ? `${firstIssue.path.join('.')}: ${firstIssue.message}`
          : 'Validation failed';

        res.statusCode = 400;
        res.end(
          JSON.stringify({
            error: {
              code: 'VALIDATION_ERROR',
              message,
              details: err.flatten(),
            },
          })
        );
        return;
      }

      // Catch-all 500 error
      console.error('Unhandled API Error:', err);
      res.statusCode = 500;
      res.end(
        JSON.stringify({
          error: {
            code: 'INTERNAL',
            message: 'An unexpected internal error occurred.',
          },
        })
      );
    }
  };
}

/**
 * Resolves trip document by accessToken. Throws NOT_FOUND if invalid or non-existent.
 */
export async function resolveTrip(
  db: Db,
  token: string | string[] | undefined
): Promise<Trip & { _id: ObjectId }> {
  const tripToken = Array.isArray(token) ? token[0] : token;
  if (!tripToken || typeof tripToken !== 'string') {
    throw notFoundError('Trip access token is required.');
  }

  let trip = (await db.collection('trips').findOne({ accessToken: tripToken })) as (Trip & { _id: ObjectId }) | null;
  if (!trip && ObjectId.isValid(tripToken)) {
    trip = (await db.collection('trips').findOne({ _id: new ObjectId(tripToken) })) as (Trip & { _id: ObjectId }) | null;
  }

  if (!trip) {
    throw notFoundError('Trip not found. The link may be invalid.');
  }

  return trip as Trip & { _id: ObjectId };
}
