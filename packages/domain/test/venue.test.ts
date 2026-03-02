import { describe, expect, it } from 'vitest';
import { VenueSchema } from '../src/venue';

describe('VenueSchema', () => {
  it('parses minimal venue', () => {
    const v = VenueSchema.parse({
      venueId: 'v1',
      name: 'テスト店',
      address: '東京都',
      jurisdiction: { country: 'JP', prefecture: '東京都' },
      timezone: 'Asia/Tokyo',
      regulationProfile: {
        profileVersion: 'tokyo-2026-02',
        identityVerificationRequired: true,
        terminalUsageLogRequired: true,
        piiRetentionYears: 3,
        prohibitedFields: ['MY_NUMBER'],
        lateNightMinorPolicyVersion: 'jp-1',
      },
    });
    expect(v.venueId).toBe('v1');
  });
});

