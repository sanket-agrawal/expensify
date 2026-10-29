import { createHandler, resolveTrip } from '../../../_lib/handler.js';
import { getActor } from '../../../_lib/auth.js';
import { validationError } from '../../../_lib/errors.js';
import { createExpenseSchema } from '../../../../shared/schemas/expense.js';

export default createHandler(['GET', 'POST'], async (req, res, { db }) => {
  const trip = await resolveTrip(db, req.query.token);
  const tripIdStr = trip._id.toString();

  // GET: List all active expenses for this trip
  if (req.method === 'GET') {
    const expenses = await db
      .collection('expenses')
      .find({
        tripId: tripIdStr,
        deletedAt: null,
      })
      .sort({ date: -1, createdAt: -1 })
      .toArray();

    return {
      expenses: expenses.map((e) => ({
        ...e,
        _id: e._id.toString(),
      })),
    };
  }

  // POST: Create a new expense
  const actor = getActor(req);
  const input = createExpenseSchema.parse(req.body);

  // Validate that paidBy belongs to this trip
  const participantIds = new Set(trip.participants.map((p) => p.id));
  if (!participantIds.has(input.paidBy)) {
    throw validationError(`Payer '${input.paidBy}' is not a participant of this trip.`);
  }

  // Validate all split shares belong to this trip
  for (const share of input.split.shares) {
    if (!participantIds.has(share.participantId)) {
      throw validationError(
        `Participant '${share.participantId}' in split shares is not a participant of this trip.`
      );
    }
  }

  // Validate that split share amounts sum to amountMinor
  const totalSharesMinor = input.split.shares.reduce((sum, s) => sum + s.amountMinor, 0);
  if (totalSharesMinor !== input.amountMinor) {
    throw validationError(
      `Sum of split shares (${totalSharesMinor} paise) does not match total amount (${input.amountMinor} paise).`
    );
  }

  const now = new Date();
  const expenseDoc = {
    tripId: tripIdStr,
    title: input.title,
    amountMinor: input.amountMinor,
    date: input.date,
    categoryKey: input.categoryKey,
    paidBy: input.paidBy,
    split: input.split,
    notes: input.notes || '',
    photos: input.photos || [],
    createdBy: actor?.id,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  const result = await db.collection('expenses').insertOne(expenseDoc);

  res.statusCode = 201;
  return {
    expense: {
      ...expenseDoc,
      _id: result.insertedId.toString(),
    },
  };
});
