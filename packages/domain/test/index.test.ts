import { describe, expect, it } from 'vitest';
import { addMoney, normalizeIdempotencyKey, VenueSchema } from '../src/index';

describe('domain index exports', () => {
  it('exports helpers', () => {
    expect(addMoney({ currency: 'JPYC', amountMinor: 1 }, { currency: 'JPYC', amountMinor: 2 }).amountMinor).toBe(3);
    expect(normalizeIdempotencyKey('abcDEF12')).toBe('abcDEF12');
    expect(() => VenueSchema.parse({})).toThrow();
  });
});

