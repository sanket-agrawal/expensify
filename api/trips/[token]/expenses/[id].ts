import { ObjectId } from 'mongodb';
import { createHandler, resolveTrip } from '../../../_lib/handler.js';
import { validationError, notFoundError } from '../../../_lib/errors.js';
import { updateExpenseSchema } from '../../../../shared/schemas/expense.js';

export default createHandler(['PATCH', 'DELETE'], async (req, _res, { db }) => {
  const trip = await resolveTrip(db, req.query.token);
  const tripIdStr = trip._id.toString();

  const idParam = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  if (!idParam || !ObjectId.isValid(idParam)) {
    throw validationError('Invalid expense ID format.');
  }

  const expenseId = new ObjectId(idParam);

  // Verify the expense exists and belongs to this trip
  const existing = await db.collection('expenses').findOne({
    _id: expenseId,
    tripId: tripIdStr,
    deletedAt: null,
  });

  if (!existing) {
    throw notFoundError('Expense not found.');
  }

  // DELETE: Soft delete with deletedAt
  if (req.method === 'DELETE') {
    await db.collection('expenses').updateOne(
      { _id: expenseId, tripId: tripIdStr },
      { $set: { deletedAt: new Date() } }
    );

    return {
      success: true,
      deletedId: idParam,
      message: 'Expense moved to trash',
    };
  }

  // PATCH: Update expense fields
  const input = updateExpenseSchema.parse(req.body);

  // If participants or split are being updated, validate
  const participantIds = new Set(trip.participants.map((p) => p.id));
  if (input.paidBy && !participantIds.has(input.paidBy)) {
    throw validationError(`Payer '${input.paidBy}' is not a participant of this trip.`);
  }

  if (input.split) {
    for (const share of input.split.shares) {
      if (!participantIds.has(share.participantId)) {
        throw validationError(
          `Participant '${share.participantId}' in split is not part of this trip.`
        );
      }
    }
  }

  const finalAmount = input.amountMinor ?? existing.amountMinor;
  const finalSplit = input.split ?? existing.split;
  if (finalSplit && finalAmount) {
    const totalShares = finalSplit.shares.reduce((sum: number, s: { amountMinor: number }) => sum + s.amountMinor, 0);
    if (totalShares !== finalAmount) {
      throw validationError(
        `Sum of split shares (${totalShares} paise) does not match total amount (${finalAmount} paise).`
      );
    }
  }

  const updates = {
    ...input,
    updatedAt: new Date(),
  };

  await db.collection('expenses').updateOne(
    { _id: expenseId, tripId: tripIdStr },
    { $set: updates }
  );

  const updatedDoc = await db.collection('expenses').findOne({ _id: expenseId });

  return {
    success: true,
    expense: {
      ...updatedDoc,
      _id: expenseId.toString(),
    },
  };
});
