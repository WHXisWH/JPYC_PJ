import { normalizeIdempotencyKey } from '@nodestay/domain';

export interface NodeStayClientOptions {
  baseUrl: string;
  fetchImpl?: typeof fetch;
}

type JsonObject = Record<string, unknown>;

export class NodeStayClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: NodeStayClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  private async json<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await this.fetchImpl(`${this.baseUrl}${path}`, init);
    if (!res.ok) throw new Error(`APIエラー: ${res.status}`);
    return (await res.json()) as T;
  }

  async health(): Promise<{ ok: true }> {
    return await this.json('/v1/health');
  }

  async listVenues(): Promise<Array<{ venueId: string; name: string; address: string; timezone: string }>> {
    return await this.json('/v1/venues');
  }

  async listPlans(venueId: string): Promise<
    Array<{
      planId: string;
      venueId: string;
      name: string;
      baseDurationMinutes: number;
      basePriceMinor: number;
      depositRequiredMinor: number;
    }>
  > {
    return await this.json(`/v1/venues/${encodeURIComponent(venueId)}/plans`);
  }

  async verifyIdentity(input: { userId: string; venueId: string }): Promise<{ identityVerificationId: string }> {
    return await this.json('/v1/identity/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    });
  }

  async checkinSession(input: {
    passId: string;
    seatId: string;
    venueId: string;
    identityVerificationId?: string;
  }): Promise<{ sessionId: string }> {
    return await this.json('/v1/sessions/checkin', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    });
  }

  async checkoutSession(input: { sessionId: string }, idempotencyKey: string): Promise<JsonObject> {
    const key = normalizeIdempotencyKey(idempotencyKey);
    return await this.json('/v1/sessions/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'idempotency-key': key },
      body: JSON.stringify(input),
    });
  }

  async getBalance(): Promise<{ currency: 'JPYC'; balanceMinor: number; depositHeldMinor: number }> {
    return await this.json('/v1/user/balance');
  }

  async createVenueAsMerchant(input: {
    name: string;
    address: string;
    timezone: string;
  }): Promise<{ venueId: string; name: string; address: string; timezone: string }> {
    return await this.json('/v1/merchant/venues', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    });
  }

  async upsertPlan(
    venueId: string,
    body: { planId?: string; name: string; baseDurationMinutes: number; basePriceMinor: number; depositRequiredMinor: number }
  ): Promise<{ planId: string; venueId: string; name: string; baseDurationMinutes: number; basePriceMinor: number; depositRequiredMinor: number }> {
    return await this.json(`/v1/merchant/venues/${encodeURIComponent(venueId)}/plans`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  async upsertSeat(
    venueId: string,
    body: { seatId?: string; type: string; status?: string }
  ): Promise<{ seatId: string; venueId: string; type: string; status: string }> {
    return await this.json(`/v1/merchant/venues/${encodeURIComponent(venueId)}/seats`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  async enableCompute(venueId: string, enable: boolean): Promise<{ venueId: string; computeEnabled: boolean }> {
    return await this.json(`/v1/merchant/venues/${encodeURIComponent(venueId)}/compute/enable`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ enable }),
    });
  }

  async createDispute(body: { venueId: string; reason: string }): Promise<{ disputeId: string; venueId: string; reason: string; status: string; createdAtIso: string }> {
    return await this.json('/v1/merchant/disputes', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  async purchasePass(input: { planId: string; venueId: string; paymentMethod: 'JPYC' }, idempotencyKey: string) {
    const key = normalizeIdempotencyKey(idempotencyKey);
    return await this.json('/v1/passes/purchase', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': key,
      },
      body: JSON.stringify(input),
    });
  }

  // --- Compute API (S6) ---

  /** GET /v1/compute/nodes */
  async listComputeNodes(): Promise<
    Array<{
      nodeId: string;
      venueId: string;
      seatId: string;
      status: 'IDLE' | 'RESERVED' | 'COMPUTING' | 'OFFLINE';
      pricePerHourMinor: number;
    }>
  > {
    return await this.json('/v1/compute/nodes');
  }

  /** POST /v1/compute/jobs */
  async submitComputeJob(body: {
    requesterId: string;
    taskType: string;
    taskSpec: { command: string; inputUri: string; outputUri: string; envVars?: Record<string, string>; dockerImage?: string };
  }): Promise<{ jobId: string }> {
    return await this.json('/v1/compute/jobs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  /** GET /v1/compute/jobs/:jobId */
  async getComputeJob(jobId: string): Promise<{ jobId: string; status: string }> {
    return await this.json(`/v1/compute/jobs/${encodeURIComponent(jobId)}`);
  }

  /** POST /v1/compute/jobs/:jobId/cancel */
  async cancelComputeJob(jobId: string): Promise<{ jobId: string; cancelled: true }> {
    return await this.json(`/v1/compute/jobs/${encodeURIComponent(jobId)}/cancel`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
    });
  }

  /** GET /v1/compute/jobs/:jobId/result */
  async getComputeJobResult(jobId: string): Promise<{ jobId: string; resultUri: string | null }> {
    return await this.json(`/v1/compute/jobs/${encodeURIComponent(jobId)}/result`);
  }
}
