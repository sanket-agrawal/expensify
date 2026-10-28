import { createHandler, resolveTrip } from '../../../_lib/handler';
import { validationError } from '../../../_lib/errors';
import { generateSignedPhotoUrl } from '../../../_lib/gcs';

export default createHandler(['GET'], async (req, _res, { db }) => {
  const trip = await resolveTrip(db, req.query.token);
  const keyParam = Array.isArray(req.query.key) ? req.query.key[0] : req.query.key;

  if (!keyParam || typeof keyParam !== 'string') {
    throw validationError("Query parameter 'key' is required.");
  }

  const url = await generateSignedPhotoUrl(
    trip.accessToken,
    keyParam,
    trip._id.toString()
  );

  return {
    url,
  };
});
