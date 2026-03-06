/**
 * Pass purchase model types.
 * Aligned with API contracts and @nodestay/api-client.
 */

/** Input for POST /v1/passes/purchase */
export interface PurchasePassInput {
  planId: string;
  venueId: string;
  paymentMethod: 'JPYC';
}

/** Response from POST /v1/passes/purchase */
export interface PurchasePassResult {
  ledgerTxId: string;
  passId: string;
}
