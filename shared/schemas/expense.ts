import { z } from 'zod';

export const CATEGORY_KEYS = [
  'stay',
  'food',
  'drinks',
  'coffee_chai',
  'groceries',
  'fuel',
  'transport',
  'flights',
  'train_bus',
  'toll_parking',
  'activities',
  'tickets',
  'shopping',
  'nightlife',
  'medical',
  'tips',
  'misc',
] as const;

export const categoryKeySchema = z.enum(CATEGORY_KEYS);
export type CategoryKey = z.infer<typeof categoryKeySchema>;

export const SPLIT_MODES = ['equal', 'exact', 'percentage'] as const;
export const splitModeSchema = z.enum(SPLIT_MODES);
export type SplitMode = z.infer<typeof splitModeSchema>;

export const splitShareSchema = z.object({
  participantId: z.string().min(1),
  amountMinor: z.number().int().min(0),
  percentage: z.number().min(0).max(100).optional(),
});

export const photoAttachmentSchema = z.object({
  objectKey: z.string().min(1),
  contentType: z.string().min(1),
  size: z.number().int().positive().max(10 * 1024 * 1024), // 10MB limit
  thumbnailUrl: z.string().optional(),
});

export const createExpenseSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120),
  amountMinor: z.number().int().positive('Amount must be greater than zero'),
  date: z.string().min(10, 'Valid date required'), // ISO string e.g. YYYY-MM-DD
  categoryKey: categoryKeySchema.default('misc'),
  paidBy: z.string().min(1, 'Payer is required'),
  split: z.object({
    mode: splitModeSchema.default('equal'),
    shares: z.array(splitShareSchema).min(1, 'At least one participant must share the expense'),
  }),
  notes: z.string().trim().max(500).optional().default(''),
  photos: z.array(photoAttachmentSchema).default([]),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const expenseSchema = z.object({
  _id: z.string(),
  tripId: z.string(),
  title: z.string(),
  amountMinor: z.number().int(),
  date: z.string(),
  categoryKey: categoryKeySchema,
  paidBy: z.string(),
  split: z.object({
    mode: splitModeSchema,
    shares: z.array(splitShareSchema),
  }),
  notes: z.string().default(''),
  photos: z.array(photoAttachmentSchema).default([]),
  createdBy: z.string().optional(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()).optional(),
  deletedAt: z.string().or(z.date()).nullable().optional(),
});

export type SplitShare = z.infer<typeof splitShareSchema>;
export type PhotoAttachment = z.infer<typeof photoAttachmentSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type Expense = z.infer<typeof expenseSchema>;
