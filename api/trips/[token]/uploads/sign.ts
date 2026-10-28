import { z } from 'zod';
import { createHandler, resolveTrip } from '../../../_lib/handler';
import { generateSignedUploadUrl } from '../../../_lib/gcs';

const signUploadSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
  size: z.number().int().positive().max(10 * 1024 * 1024), // 10MB
});

export default createHandler(['POST'], async (req, _res, { db }) => {
  const trip = await resolveTrip(db, req.query.token);
  const input = signUploadSchema.parse(req.body);

  const { uploadUrl, objectKey } = await generateSignedUploadUrl(
    trip.accessToken,
    input.filename,
    input.contentType,
    input.size
  );

  return {
    uploadUrl,
    objectKey,
  };
});
