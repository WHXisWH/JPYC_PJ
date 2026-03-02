import { z } from 'zod';

export const JurisdictionSchema = z.object({
  country: z.literal('JP'),
  prefecture: z.string().min(1),
  city: z.string().min(1).optional(),
  ward: z.string().min(1).optional(),
});
export type Jurisdiction = z.infer<typeof JurisdictionSchema>;

export const RegulationProfileSchema = z.object({
  profileVersion: z.string().min(1),
  identityVerificationRequired: z.boolean(),
  terminalUsageLogRequired: z.boolean(),
  piiRetentionYears: z.number().int().positive(),
  prohibitedFields: z.array(z.enum(['MY_NUMBER', 'HEALTH_INFO'])),
  lateNightMinorPolicyVersion: z.string().min(1),
});
export type RegulationProfile = z.infer<typeof RegulationProfileSchema>;

export const VenueSchema = z.object({
  venueId: z.string().min(1),
  name: z.string().min(1),
  address: z.string().min(1),
  jurisdiction: JurisdictionSchema,
  timezone: z.string().min(1),
  regulationProfile: RegulationProfileSchema,
});
export type Venue = z.infer<typeof VenueSchema>;

