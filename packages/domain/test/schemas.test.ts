import { describe, expect, it } from 'vitest';
import {
  AccessPassSchema,
  DisputeSchema,
  IdentityVerificationSchema,
  LedgerAccountSchema,
  LedgerEntrySchema,
  LedgerTransactionSchema,
  OutboxEventSchema,
  ReservationSchema,
  SessionSchema,
  SettlementSchema,
  TerminalSchema,
} from '../src/index';

describe('PRD schemas parse', () => {
  it('parses representative objects', () => {
    expect(
      TerminalSchema.parse({
        terminalId: 't1',
        venueId: 'v1',
        seatId: 's1',
        fingerprintHash: 'hash',
      }).terminalId,
    ).toBe('t1');

    expect(
      IdentityVerificationSchema.parse({
        identityVerificationId: 'iv1',
        userId: 'u1',
        venueId: 'v1',
        method: 'DRIVER_LICENSE',
        verifiedAt: new Date().toISOString(),
        verifier: 'STAFF',
        capturedFields: { name: 'a', birthDate: '2000-01-01', address: 'x' },
        retentionUntil: new Date().toISOString(),
      }).identityVerificationId,
    ).toBe('iv1');

    expect(
      AccessPassSchema.parse({
        passId: 'p1',
        ownerUserId: 'u1',
        planId: 'pl1',
        status: 'ACTIVE',
        remainingMinutes: 60,
        depositStatus: 'NONE',
        depositAmountMinor: 0,
        kycVerified: false,
        createdAt: new Date().toISOString(),
        expiresAt: new Date().toISOString(),
      }).passId,
    ).toBe('p1');

    expect(
      ReservationSchema.parse({
        reservationId: 'r1',
        userId: 'u1',
        venueId: 'v1',
        planId: 'pl1',
        startAt: new Date().toISOString(),
        endAt: new Date().toISOString(),
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      }).reservationId,
    ).toBe('r1');

    expect(
      SessionSchema.parse({
        sessionId: 'ss1',
        passId: 'p1',
        seatId: 's1',
        venueId: 'v1',
        checkInAt: new Date().toISOString(),
        status: 'IN_USE',
        usedMinutes: 0,
        overtimeMinutes: 0,
        charges: { baseMinor: 0, overtimeMinor: 0, amenitiesMinor: 0, damageMinor: 0 },
        evidence: { checkInMethod: 'QR', capturedAt: new Date().toISOString() },
      }).sessionId,
    ).toBe('ss1');

    expect(
      LedgerAccountSchema.parse({
        accountId: 'a1',
        ownerType: 'USER',
        ownerId: 'u1',
        currency: 'JPYC',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      }).accountId,
    ).toBe('a1');

    expect(
      LedgerTransactionSchema.parse({
        ledgerTxId: 'ltx1',
        type: 'PURCHASE',
        referenceType: 'PASS',
        referenceId: 'p1',
        status: 'PENDING',
        idempotencyKey: 'abcDEF12',
        requestHash: 'h',
        createdAt: new Date().toISOString(),
      }).ledgerTxId,
    ).toBe('ltx1');

    expect(
      LedgerEntrySchema.parse({
        entryId: 'e1',
        ledgerTxId: 'ltx1',
        accountId: 'a1',
        direction: 'DEBIT',
        amount: { currency: 'JPYC', amountMinor: 1 },
      }).entryId,
    ).toBe('e1');

    expect(
      OutboxEventSchema.parse({
        eventId: 'o1',
        eventType: 'CHAIN_TRANSFER',
        ledgerTxId: 'ltx1',
        status: 'NEW',
        createdAt: new Date().toISOString(),
      }).eventId,
    ).toBe('o1');

    expect(
      SettlementSchema.parse({
        settlementId: 'st1',
        venueId: 'v1',
        periodStart: new Date().toISOString(),
        periodEnd: new Date().toISOString(),
        seatRevenueMinor: 0,
        computeRevenueMinor: 0,
        refundsMinor: 0,
        feesMinor: 0,
        netPayoutMinor: 0,
        status: 'PENDING',
      }).settlementId,
    ).toBe('st1');

    expect(
      DisputeSchema.parse({
        disputeId: 'd1',
        venueId: 'v1',
        status: 'OPEN',
        reason: 'x',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).disputeId,
    ).toBe('d1');
  });
});

