import { z } from 'zod';

export const DisputeStatusSchema = z.enum(['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED']);
export type DisputeStatus = z.infer<typeof DisputeStatusSchema>;

export const DisputeSchema = z.object({
  disputeId: z.string().min(1),
  venueId: z.string().min(1),
  sessionId: z.string().min(1).optional(),
  passId: z.string().min(1).optional(),
  userId: z.string().min(1).optional(),
  status: DisputeStatusSchema,
  reason: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Dispute = z.infer<typeof DisputeSchema>;

