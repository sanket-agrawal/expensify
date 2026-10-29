import { createHandler, resolveTrip } from '../../../_lib/handler.js';
import { validationError } from '../../../_lib/errors.js';
import { createSettlementSchema } from '../../../../shared/schemas/settlement.js';

export default createHandler(['GET', 'POST'], async (req, res, { db }) => {
  const trip = await resolveTrip(db, req.query.token);
  const tripIdStr = trip._id.toString();

  // GET: List all recorded settlements for this trip
  if (req.method === 'GET') {
    const settlements = await db
      .collection('settlements')
      .find({ tripId: tripIdStr })
      .sort({ date: -1, createdAt: -1 })
      .toArray();

    return {
      settlements: settlements.map((s) => ({
        ...s,
        _id: s._id.toString(),
      })),
    };
  }

  // POST: Record a new settlement payment
  const input = createSettlementSchema.parse(req.body);

  const participantIds = new Set(trip.participants.map((p) => p.id));
  if (!participantIds.has(input.from)) {
    throw validationError(`Sender '${input.from}' is not a participant of this trip.`);
  }
  if (!participantIds.has(input.to)) {
    throw validationError(`Recipient '${input.to}' is not a participant of this trip.`);
  }

  const settlementDoc = {
    tripId: tripIdStr,
    from: input.from,
    to: input.to,
    amountMinor: input.amountMinor,
    date: input.date || new Date().toISOString().slice(0, 10),
    notes: input.notes || '',
    createdAt: new Date(),
  };

  const result = await db.collection('settlements').insertOne(settlementDoc);

  res.statusCode = 201;
  return {
    settlement: {
      ...settlementDoc,
      _id: result.insertedId.toString(),
    },
  };
});
