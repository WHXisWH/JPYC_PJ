import { z } from 'zod';

export const AccessPassStatusSchema = z.enum([
  'ACTIVE',
  'IN_USE',
  'CONSUMED',
  'EXPIRED',
  'TRANSFERRED',
  'SUSPENDED',
  'REFUNDED',
  'DISPUTED',
]);
export type AccessPassStatus = z.infer<typeof AccessPassStatusSchema>;

export const DepositStatusSchema = z.enum(['NONE', 'HELD', 'PARTIALLY_CAPTURED', 'RELEASED']);
export type DepositStatus = z.infer<typeof DepositStatusSchema>;

export const ChainRefSchema = z.object({
  tokenId: z.string().min(1),
  contractAddress: z.string().min(1),
  txHash: z.string().min(1),
});
export type ChainRef = z.infer<typeof ChainRefSchema>;

export const AccessPassSchema = z.object({
  passId: z.string().min(1),
  ownerUserId: z.string().min(1),
  ownerWallet: z.string().min(1).optional(),
  planId: z.string().min(1),
  venueId: z.string().min(1).optional(),
  status: AccessPassStatusSchema,
  remainingMinutes: z.number().int().nonnegative(),
  depositStatus: DepositStatusSchema,
  depositAmountMinor: z.number().int().nonnegative(),
  kycVerified: z.boolean(),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  chainRef: ChainRefSchema.optional(),
});
export type AccessPass = z.infer<typeof AccessPassSchema>;

