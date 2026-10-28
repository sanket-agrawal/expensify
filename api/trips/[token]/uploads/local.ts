import type { Db } from 'mongodb';
import { Binary } from 'mongodb';
import fs from 'node:fs';
import path from 'node:path';
import { createHandler, resolveTrip, type VercelRequest, type VercelResponse } from '../../../_lib/handler';
import { validationError, notFoundError } from '../../../_lib/errors';

export default createHandler(['PUT', 'GET'], async (req: VercelRequest, res: VercelResponse, { db }: { db: Db }) => {
  const trip = await resolveTrip(db, req.query.token);
  const keyParam = Array.isArray(req.query.key) ? req.query.key[0] : req.query.key;

  if (!keyParam || typeof keyParam !== 'string') {
    throw validationError("Query parameter 'key' is required.");
  }

  // Ensure key belongs to this trip (by accessToken or ObjectId)
  const prefixToken = `trips/${trip.accessToken}/`;
  const prefixId = `trips/${trip._id.toString()}/`;
  if (!keyParam.startsWith(prefixToken) && !keyParam.startsWith(prefixId)) {
    throw validationError('Object key does not belong to this trip.');
  }

  if (req.method === 'PUT') {
    const rawBuffer = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from((req.body as string) || '');

    if (rawBuffer.length === 0) {
      throw validationError('Uploaded file body is empty.');
    }

    const contentType = (req.headers['content-type'] as string) || 'image/jpeg';

    // 1. Store in MongoDB media_uploads collection
    await db.collection('media_uploads').updateOne(
      { key: keyParam },
      {
        $set: {
          key: keyParam,
          tripId: trip._id,
          contentType,
          data: new Binary(rawBuffer),
          size: rawBuffer.length,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    // 2. Also write to local .uploads directory for dev persistence
    try {
      const localFilePath = path.join(process.cwd(), '.uploads', keyParam);
      fs.mkdirSync(path.dirname(localFilePath), { recursive: true });
      fs.writeFileSync(localFilePath, rawBuffer);
    } catch {
      // Ignore disk write errors in readonly serverless environments
    }

    return {
      success: true,
      key: keyParam,
      size: rawBuffer.length,
    };
  }

  if (req.method === 'GET') {
    // 1. Try to fetch from MongoDB
    const doc = await db.collection('media_uploads').findOne({ key: keyParam });
    if (doc && doc.data) {
      const buf: Buffer = Buffer.isBuffer(doc.data)
        ? doc.data
        : (doc.data as { buffer?: Buffer }).buffer || Buffer.from(doc.data);

      res.statusCode = 200;
      res.setHeader('Content-Type', (doc.contentType as string) || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Content-Length', buf.length);
      res.end(buf);
      return;
    }

    // 2. Try to read from local .uploads directory
    const localFilePath = path.join(process.cwd(), '.uploads', keyParam);
    if (fs.existsSync(localFilePath)) {
      const buf = fs.readFileSync(localFilePath);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Content-Length', buf.length);
      res.end(buf);
      return;
    }

    throw notFoundError('Photo not found.');
  }
});
