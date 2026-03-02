import { z } from 'zod';

export const ReservationStatusSchema = z.enum([
  'PENDING',
  'CONFIRMED',
  'CANCELLED',
  'NO_SHOW',
  'CHECKED_IN',
  'EXPIRED',
]);
export type ReservationStatus = z.infer<typeof ReservationStatusSchema>;

export const ReservationSchema = z.object({
  reservationId: z.string().min(1),
  userId: z.string().min(1),
  venueId: z.string().min(1),
  planId: z.string().min(1),
  seatType: z.enum(['OPEN', 'BOOTH', 'FLAT', 'VIP']).optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  status: ReservationStatusSchema,
  depositHoldLedgerTxId: z.string().min(1).optional(),
  createdAt: z.string().datetime(),
});
export type Reservation = z.infer<typeof ReservationSchema>;

