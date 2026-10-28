import crypto from 'node:crypto';
import { createHandler } from '../_lib/handler';
import { createTripSchema } from '../../shared/schemas/trip';

const COLOR_KEYS = ['lagoon', 'coral', 'sunshine', 'seafoam', 'deep-sea', 'sky'];

export default createHandler(['POST'], async (req, res, { db }) => {
  const input = createTripSchema.parse(req.body);

  // Generate unguessable URL-safe access token (24 chars)
  const accessToken = crypto.randomBytes(18).toString('base64url');

  // Build participants with unique IDs and color keys
  const participants = input.participants.map((name, index) => ({
    id: `p_${crypto.randomBytes(6).toString('hex')}`,
    name,
    colorKey: COLOR_KEYS[index % COLOR_KEYS.length] ?? 'lagoon',
  }));

  const tripDoc = {
    name: input.name,
    emoji: input.emoji || '🏖️',
    currency: input.currency || 'INR',
    accessToken,
    participants,
    createdAt: new Date(),
  };

  const result = await db.collection('trips').insertOne(tripDoc);

  res.statusCode = 201;
  return {
    trip: {
      ...tripDoc,
      _id: result.insertedId.toString(),
    },
    accessToken,
  };
});
