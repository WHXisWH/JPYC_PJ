import { z } from 'zod';

export const TerminalSchema = z.object({
  terminalId: z.string().min(1),
  venueId: z.string().min(1),
  seatId: z.string().min(1),
  assetTag: z.string().min(1).optional(),
  fingerprintHash: z.string().min(1),
  lastSeenAt: z.string().datetime().optional(),
});
export type Terminal = z.infer<typeof TerminalSchema>;

