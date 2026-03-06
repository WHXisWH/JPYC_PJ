/**
 * Venue & Plan model types.
 * Aligned with @nodestay/api-client listVenues / listPlans responses.
 */

/** List item from GET /v1/venues */
export interface VenueListItem {
  venueId: string;
  name: string;
  address: string;
  timezone: string;
}

/** List item from GET /v1/venues/:venueId/plans */
export interface PlanListItem {
  planId: string;
  venueId: string;
  name: string;
  baseDurationMinutes: number;
  basePriceMinor: number;
  depositRequiredMinor: number;
}

/** Alias for list display */
export type Venue = VenueListItem;
export type Plan = PlanListItem;
