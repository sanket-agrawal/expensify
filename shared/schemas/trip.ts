import { z } from 'zod';

export const participantSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, 'Name is required').max(50),
  colorKey: z.string().optional().default(''),
});

export const createTripSchema = z.object({
  name: z.string().trim().min(1, 'Trip name is required').max(80),
  emoji: z.string().trim().max(4).optional().default('🏖️'),
  currency: z.string().min(3).max(3).default('INR'),
  participants: z
    .array(z.string().trim().min(1, 'Participant name cannot be blank'))
    .min(2, 'At least 2 participants are required')
    .max(10, 'Maximum 10 participants allowed')
    .refine(
      (names) => new Set(names.map((n) => n.toLowerCase())).size === names.length,
      'Participant names must be unique'
    ),
});

export const tripSchema = z.object({
  _id: z.string().optional(),
  name: z.string(),
  emoji: z.string().default('🏖️'),
  currency: z.string().default('INR'),
  accessToken: z.string().min(10),
  participants: z.array(participantSchema),
  createdAt: z.string().or(z.date()),
});

export type Participant = z.infer<typeof participantSchema>;
export type CreateTripInput = z.infer<typeof createTripSchema>;
export type Trip = z.infer<typeof tripSchema>;
