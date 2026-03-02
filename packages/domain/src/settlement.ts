import { z } from 'zod';

export const SettlementSchema = z.object({
  settlementId: z.string().min(1),
  venueId: z.string().min(1),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  seatRevenueMinor: z.number().int().nonnegative(),
  computeRevenueMinor: z.number().int().nonnegative(),
  refundsMinor: z.number().int().nonnegative(),
  feesMinor: z.number().int().nonnegative(),
  netPayoutMinor: z.number().int().nonnegative(),
  status: z.enum(['PENDING', 'CONFIRMED', 'PAID']),
});
export type Settlement = z.infer<typeof SettlementSchema>;

