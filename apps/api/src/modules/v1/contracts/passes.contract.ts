import { z } from 'zod';

/** POST /v1/passes/purchase body */
export const PurchasePassBodySchema = z.object({
  planId: z.string().min(1),
  venueId: z.string().min(1),
  paymentMethod: z.literal('JPYC'),
});
export type PurchasePassBody = z.infer<typeof PurchasePassBodySchema>;

/** POST /v1/passes/purchase response */
export const PurchasePassResponseSchema = z.object({
  ledgerTxId: z.string().min(1),
  passId: z.string().min(1),
});
export type PurchasePassResponse = z.infer<typeof PurchasePassResponseSchema>;

/** POST /v1/passes/:passId/transfer response */
export const PassStatusSchema = z.enum([
  'ACTIVE',
  'IN_USE',
  'CONSUMED',
  'EXPIRED',
  'TRANSFERRED',
  'SUSPENDED',
  'REFUNDED',
  'DISPUTED',
]);
export const TransferPassResponseSchema = z.object({
  passId: z.string().min(1),
  status: PassStatusSchema,
});
export type TransferPassResponse = z.infer<typeof TransferPassResponseSchema>;
