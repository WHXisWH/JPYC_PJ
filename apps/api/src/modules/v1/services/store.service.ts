import { Injectable } from '@nestjs/common';
import crypto from 'node:crypto';

type Id = string;

export interface VenueRecord {
  venueId: Id;
  name: string;
  address: string;
  timezone: string;
}

export interface PricePlanRecord {
  planId: Id;
  venueId: Id;
  name: string;
  baseDurationMinutes: number;
  basePriceMinor: number;
  depositRequiredMinor: number;
}

export interface SeatRecord {
  seatId: Id;
  venueId: Id;
  type: 'OPEN' | 'BOOTH' | 'FLAT' | 'VIP';
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'COMPUTE_MODE';
}

export interface IdentityVerificationRecord {
  identityVerificationId: Id;
  userId: Id;
  venueId: Id;
  verifiedAtIso: string;
}

export interface AccessPassRecord {
  passId: Id;
  ownerUserId: Id;
  planId: Id;
  venueId: Id;
  status: 'ACTIVE' | 'IN_USE' | 'CONSUMED' | 'EXPIRED' | 'TRANSFERRED' | 'SUSPENDED' | 'REFUNDED' | 'DISPUTED';
  remainingMinutes: number;
  depositAmountMinor: number;
}

export interface SessionRecord {
  sessionId: Id;
  passId: Id;
  seatId: Id;
  venueId: Id;
  checkInAtIso: string;
  checkOutAtIso?: string;
  status: 'IN_USE' | 'ENDED';
}

export interface ComputeNodeRecord {
  nodeId: Id;
  venueId: Id;
  seatId: Id;
  status: 'IDLE' | 'RESERVED' | 'COMPUTING' | 'OFFLINE';
  pricePerHourMinor: number;
}

export interface ComputeJobRecord {
  jobId: Id;
  requesterId: Id;
  nodeId?: Id;
  status: 'PENDING' | 'ASSIGNED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  taskType: string;
  taskSpec: { command: string; inputUri: string; outputUri: string; envVars: Record<string, string>; dockerImage?: string };
}

export interface DisputeRecord {
  disputeId: Id;
  venueId: Id;
  reason: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';
  createdAtIso: string;
}

@Injectable()
export class StoreService {
  private readonly venues = new Map<Id, VenueRecord>();
  private readonly plans = new Map<Id, PricePlanRecord>();
  private readonly seats = new Map<Id, SeatRecord>();
  private readonly identity = new Map<Id, IdentityVerificationRecord>();
  private readonly passes = new Map<Id, AccessPassRecord>();
  private readonly sessions = new Map<Id, SessionRecord>();
  private readonly computeEnabledVenues = new Set<Id>();
  private readonly computeNodes = new Map<Id, ComputeNodeRecord>();
  private readonly computeJobs = new Map<Id, ComputeJobRecord>();
  private readonly disputes = new Map<Id, DisputeRecord>();

  constructor() {
    // 最小のダミーデータ（MVPの疎通用）
    const venueId = 'venue_demo';
    this.venues.set(venueId, { venueId, name: 'デモ店舗', address: '東京都', timezone: 'Asia/Tokyo' });

    const planId = 'plan_3h';
    this.plans.set(planId, {
      planId,
      venueId,
      name: '3時間パック',
      baseDurationMinutes: 180,
      basePriceMinor: 1500,
      depositRequiredMinor: 500,
    });

    const seatId = 'seat_demo';
    this.seats.set(seatId, { seatId, venueId, type: 'BOOTH', status: 'AVAILABLE' });
  }

  listVenues(): VenueRecord[] {
    return [...this.venues.values()];
  }

  listPlansByVenue(venueId: string): PricePlanRecord[] {
    return [...this.plans.values()].filter((p) => p.venueId === venueId);
  }

  createVenue(input: { name: string; address: string; timezone: string }): VenueRecord {
    const venueId = this.id('venue');
    const v: VenueRecord = { venueId, ...input };
    this.venues.set(venueId, v);
    return v;
  }

  upsertPlan(input: {
    planId?: string;
    venueId: string;
    name: string;
    baseDurationMinutes: number;
    basePriceMinor: number;
    depositRequiredMinor: number;
  }): PricePlanRecord {
    const planId = input.planId ?? this.id('plan');
    const p: PricePlanRecord = { ...input, planId };
    this.plans.set(planId, p);
    return p;
  }

  upsertSeat(input: { seatId?: string; venueId: string; type: SeatRecord['type']; status?: SeatRecord['status'] }): SeatRecord {
    const seatId = input.seatId ?? this.id('seat');
    const s: SeatRecord = { seatId, venueId: input.venueId, type: input.type, status: input.status ?? 'AVAILABLE' };
    this.seats.set(seatId, s);
    return s;
  }

  listSeatsByVenue(venueId: string): SeatRecord[] {
    return [...this.seats.values()].filter((s) => s.venueId === venueId);
  }

  createIdentityVerification(input: { userId: string; venueId: string }): IdentityVerificationRecord {
    const identityVerificationId = this.id('idv');
    const r: IdentityVerificationRecord = {
      identityVerificationId,
      userId: input.userId,
      venueId: input.venueId,
      verifiedAtIso: new Date().toISOString(),
    };
    this.identity.set(identityVerificationId, r);
    return r;
  }

  getIdentityVerification(id: string): IdentityVerificationRecord | undefined {
    return this.identity.get(id);
  }

  createPass(input: { ownerUserId: string; planId: string; venueId: string; depositAmountMinor: number }): AccessPassRecord {
    const passId = this.id('pass');
    const r: AccessPassRecord = {
      passId,
      ownerUserId: input.ownerUserId,
      planId: input.planId,
      venueId: input.venueId,
      status: 'ACTIVE',
      remainingMinutes: 0,
      depositAmountMinor: input.depositAmountMinor,
    };
    this.passes.set(passId, r);
    return r;
  }

  getPass(passId: string): AccessPassRecord | undefined {
    return this.passes.get(passId);
  }

  transferPass(passId: string): AccessPassRecord | undefined {
    const p = this.passes.get(passId);
    if (!p) return undefined;
    p.status = 'TRANSFERRED';
    this.passes.set(passId, p);
    return p;
  }

  startSession(input: { passId: string; seatId: string; venueId: string }): SessionRecord {
    const sessionId = this.id('sess');
    const r: SessionRecord = {
      sessionId,
      passId: input.passId,
      seatId: input.seatId,
      venueId: input.venueId,
      checkInAtIso: new Date().toISOString(),
      status: 'IN_USE',
    };
    this.sessions.set(sessionId, r);
    return r;
  }

  endSession(sessionId: string): SessionRecord | undefined {
    const s = this.sessions.get(sessionId);
    if (!s) return undefined;
    s.status = 'ENDED';
    s.checkOutAtIso = new Date().toISOString();
    this.sessions.set(sessionId, s);
    return s;
  }

  enableComputeForVenue(venueId: string) {
    this.computeEnabledVenues.add(venueId);
  }

  computeEnabled(venueId: string): boolean {
    return this.computeEnabledVenues.has(venueId);
  }

  listComputeNodes(): ComputeNodeRecord[] {
    return [...this.computeNodes.values()];
  }

  registerComputeNode(input: { venueId: string; seatId: string; pricePerHourMinor: number }): ComputeNodeRecord {
    const nodeId = this.id('node');
    const n: ComputeNodeRecord = { nodeId, venueId: input.venueId, seatId: input.seatId, status: 'IDLE', pricePerHourMinor: input.pricePerHourMinor };
    this.computeNodes.set(nodeId, n);
    return n;
  }

  submitComputeJob(input: Omit<ComputeJobRecord, 'jobId' | 'status'>): ComputeJobRecord {
    const jobId = this.id('job');
    const j: ComputeJobRecord = { jobId, status: 'PENDING', ...input };
    this.computeJobs.set(jobId, j);
    return j;
  }

  getComputeJob(jobId: string): ComputeJobRecord | undefined {
    return this.computeJobs.get(jobId);
  }

  cancelComputeJob(jobId: string): ComputeJobRecord | undefined {
    const j = this.computeJobs.get(jobId);
    if (!j) return undefined;
    j.status = 'CANCELLED';
    this.computeJobs.set(jobId, j);
    return j;
  }

  listDisputes(venueId?: string): DisputeRecord[] {
    const all = [...this.disputes.values()];
    if (!venueId) return all;
    return all.filter((d) => d.venueId === venueId);
  }

  createDispute(input: { venueId: string; reason: string }): DisputeRecord {
    const disputeId = this.id('disp');
    const d: DisputeRecord = {
      disputeId,
      venueId: input.venueId,
      reason: input.reason,
      status: 'OPEN',
      createdAtIso: new Date().toISOString(),
    };
    this.disputes.set(disputeId, d);
    return d;
  }

  private id(prefix: string): string {
    const hex = crypto.randomBytes(8).toString('hex');
    return `${prefix}_${hex}`;
  }
}
