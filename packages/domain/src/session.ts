import { z } from 'zod';

export const SessionStatusSchema = z.enum(['PENDING', 'IN_USE', 'ENDED', 'OVERTIME', 'DISPUTED']);
export type SessionStatus = z.infer<typeof SessionStatusSchema>;

export const CheckInMethodSchema = z.enum(['QR', 'KIOSK', 'STAFF']);
export type CheckInMethod = z.infer<typeof CheckInMethodSchema>;

export const SessionSchema = z.object({
  sessionId: z.string().min(1),
  passId: z.string().min(1),
  reservationId: z.string().min(1).optional(),
  seatId: z.string().min(1),
  terminalId: z.string().min(1).optional(),
  venueId: z.string().min(1),
  checkInAt: z.string().datetime(),
  checkOutAt: z.string().datetime().optional(),
  status: SessionStatusSchema,
  usedMinutes: z.number().int().nonnegative(),
  overtimeMinutes: z.number().int().nonnegative(),
  charges: z.object({
    baseMinor: z.number().int().nonnegative(),
    overtimeMinor: z.number().int().nonnegative(),
    amenitiesMinor: z.number().int().nonnegative(),
    damageMinor: z.number().int().nonnegative(),
  }),
  identityVerificationId: z.string().min(1).optional(),
  evidence: z.object({
    checkInMethod: CheckInMethodSchema,
    terminalUsageLogHash: z.string().min(1).optional(),
    capturedAt: z.string().datetime(),
  }),
});
export type Session = z.infer<typeof SessionSchema>;

