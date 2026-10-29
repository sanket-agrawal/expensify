import { describe, it, expect, vi } from 'vitest';
import { createHandler, type VercelRequest, type VercelResponse } from '../../api/_lib/handler';
import { validationError } from '../../api/_lib/errors';
import { generateSignedUploadUrl } from '../../api/_lib/gcs';
import { z } from 'zod';

function createMockReqRes(options: {
  method?: string;
  body?: unknown;
  query?: Record<string, string>;
}) {
  const req = {
    method: options.method || 'GET',
    body: options.body || {},
    query: options.query || {},
    headers: {},
    on: vi.fn(),
  } as unknown as VercelRequest;

  let statusCode = 200;
  let responseData = '';
  const headers: Record<string, string> = {};

  const res = {
    get statusCode() {
      return statusCode;
    },
    set statusCode(code: number) {
      statusCode = code;
    },
    setHeader: vi.fn((key: string, val: string) => {
      headers[key.toLowerCase()] = val;
    }),
    end: vi.fn((data?: string) => {
      if (data) responseData = data;
    }),
    json: vi.fn((data: unknown) => {
      responseData = JSON.stringify(data);
    }),
    writableEnded: false,
  } as unknown as VercelResponse;

  return { req, res, getBody: () => (responseData ? JSON.parse(responseData) : null), getStatus: () => statusCode };
}

describe('api/_lib/handler.ts', () => {
  it('rejects disallowed HTTP methods with 405', async () => {
    const handler = createHandler(['POST'], async () => {
      return { ok: true };
    });

    const { req, res, getBody, getStatus } = createMockReqRes({ method: 'GET' });
    await handler(req, res);

    expect(getStatus()).toBe(405);
    const body = getBody();
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toContain('Method GET not allowed');
  });

  it('formats custom ApiError with correct status code and standard error shape', async () => {
    const handler = createHandler(['GET'], async () => {
      throw validationError('Custom validation issue');
    });

    const { req, res, getBody, getStatus } = createMockReqRes({ method: 'GET' });
    // Mock getDb in handler to avoid real Mongo connection in pure unit test
    vi.spyOn(await import('../../api/_lib/db'), 'getDb').mockResolvedValueOnce({} as never);

    await handler(req, res);

    expect(getStatus()).toBe(400);
    const body = getBody();
    expect(body.error).toEqual({
      code: 'VALIDATION_ERROR',
      message: 'Custom validation issue',
    });
  });

  it('catches and transforms ZodErrors into standard error shape', async () => {
    const testSchema = z.object({
      title: z.string().min(3),
    });

    const handler = createHandler(['POST'], async (req) => {
      testSchema.parse(req.body);
      return { ok: true };
    });

    const { req, res, getBody, getStatus } = createMockReqRes({
      method: 'POST',
      body: { title: 'ab' }, // too short
    });
    vi.spyOn(await import('../../api/_lib/db'), 'getDb').mockResolvedValueOnce({} as never);

    await handler(req, res);

    expect(getStatus()).toBe(400);
    const body = getBody();
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toContain('title: String must contain at least 3 character(s)');
  });
});

describe('api/_lib/gcs.ts validation', () => {
  it('allows application/pdf content type', async () => {
    const res = await generateSignedUploadUrl('trip_123', 'bill.pdf', 'application/pdf', 1024);
    expect(res.objectKey).toContain('.pdf');
    expect(res.uploadUrl).toBeDefined();
  });

  it('rejects disallowed content types', async () => {
    await expect(
      generateSignedUploadUrl('trip_123', 'doc.zip', 'application/zip', 1024)
    ).rejects.toThrow('Unsupported file type');
  });

  it('rejects files larger than 10MB', async () => {
    const elevenMb = 11 * 1024 * 1024;
    await expect(
      generateSignedUploadUrl('trip_123', 'huge.jpg', 'image/jpeg', elevenMb)
    ).rejects.toThrow('File size exceeds the 10MB maximum limit');
  });
});
