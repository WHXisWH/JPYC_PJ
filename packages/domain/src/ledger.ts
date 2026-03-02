import { z } from 'zod';
import { MoneySchema } from './money';

export const LedgerAccountOwnerTypeSchema = z.enum(['USER', 'VENUE', 'PLATFORM', 'CLEARING']);
export type LedgerAccountOwnerType = z.infer<typeof LedgerAccountOwnerTypeSchema>;

export const LedgerAccountSchema = z.object({
  accountId: z.string().min(1),
  ownerType: LedgerAccountOwnerTypeSchema,
  ownerId: z.string().min(1).optional(),
  currency: z.literal('JPYC'),
  chainRef: z
    .object({
      chainId: z.number().int().nonnegative(),
      tokenContractAddress: z.string().min(1),
    })
    .optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED']),
  createdAt: z.string().datetime(),
});
export type LedgerAccount = z.infer<typeof LedgerAccountSchema>;

export const LedgerTransactionTypeSchema = z.enum([
  'PURCHASE',
  'DEPOSIT_HOLD',
  'DEPOSIT_CAPTURE',
  'DEPOSIT_RELEASE',
  'CHECKOUT_CHARGE',
  'REFUND',
  'PAYOUT',
  'COMPUTE_CHARGE',
]);
export type LedgerTransactionType = z.infer<typeof LedgerTransactionTypeSchema>;

export const LedgerTransactionSchema = z.object({
  ledgerTxId: z.string().min(1),
  type: LedgerTransactionTypeSchema,
  referenceType: z.enum(['PASS', 'SESSION', 'RESERVATION', 'JOB']),
  referenceId: z.string().min(1),
  status: z.enum(['PENDING', 'POSTED', 'FAILED', 'REVERSED']),
  idempotencyKey: z.string().min(8),
  requestHash: z.string().min(1),
  externalTxHash: z.string().min(1).optional(),
  createdAt: z.string().datetime(),
  postedAt: z.string().datetime().optional(),
});
export type LedgerTransaction = z.infer<typeof LedgerTransactionSchema>;

export const LedgerEntrySchema = z.object({
  entryId: z.string().min(1),
  ledgerTxId: z.string().min(1),
  accountId: z.string().min(1),
  direction: z.enum(['DEBIT', 'CREDIT']),
  amount: MoneySchema,
  memo: z.string().min(1).optional(),
});
export type LedgerEntry = z.infer<typeof LedgerEntrySchema>;

export const OutboxEventSchema = z.object({
  eventId: z.string().min(1),
  eventType: z.enum(['CHAIN_TRANSFER', 'PAYOUT_REQUEST', 'REFUND_REQUEST']),
  ledgerTxId: z.string().min(1),
  status: z.enum(['NEW', 'SENT', 'CONFIRMED', 'FAILED']),
  createdAt: z.string().datetime(),
  lastTriedAt: z.string().datetime().optional(),
});
export type OutboxEvent = z.infer<typeof OutboxEventSchema>;

