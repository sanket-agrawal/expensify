import { z } from 'zod';

export const settlementAttachmentSchema = z.object({
  objectKey: z.string().min(1),
  contentType: z.string().min(1),
  filename: z.string().optional(),
  size: z.number().int().positive().max(10 * 1024 * 1024).optional(),
});
export type SettlementAttachment = z.infer<typeof settlementAttachmentSchema>;

export const createSettlementSchema = z.object({
  from: z.string().min(1, 'Sender participant required'),
  to: z.string().min(1, 'Receiver participant required'),
  amountMinor: z.number().int().positive('Amount must be greater than zero'),
  date: z.string().min(10).optional().default(() => new Date().toISOString().slice(0, 10)),
  notes: z.string().trim().max(200).optional().default(''),
  attachment: settlementAttachmentSchema.optional().nullable(),
}).refine((data) => data.from !== data.to, {
  message: 'Sender and receiver cannot be the same person',
  path: ['to'],
});

export const settlementSchema = z.object({
  _id: z.string(),
  tripId: z.string(),
  from: z.string(),
  to: z.string(),
  amountMinor: z.number().int(),
  date: z.string(),
  notes: z.string().optional().default(''),
  attachment: settlementAttachmentSchema.optional().nullable(),
  createdAt: z.string().or(z.date()),
});

export type CreateSettlementInput = z.input<typeof createSettlementSchema>;
export type Settlement = z.infer<typeof settlementSchema>;

