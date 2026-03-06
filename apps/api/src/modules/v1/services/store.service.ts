import { Injectable } from '@nestjs/common';
import crypto from 'node:crypto';

type Id = string;

export interface VenueRecord {
  venueId: Id;
  name: string;
  address: string;
  timezone: string;
  latitude: number;
  longitude: number;
  amenities?: string[];
  openHours?: string;
  availableSeats?: number;
  totalSeats?: number;
  cheapestPlanMinor?: number;
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
    this.seedVenues();
  }

  private seedVenues() {
    const venues: VenueRecord[] = [
      { venueId: 'venue_shibuya_01', name: 'NodeCafe 渋谷センター', address: '東京都渋谷区宇田川町21-6', timezone: 'Asia/Tokyo', latitude: 35.6610, longitude: 139.6983, amenities: ['Wi-Fi', 'GPU', '個室', 'ドリンクバー'], openHours: '24時間営業', availableSeats: 12, totalSeats: 40, cheapestPlanMinor: 500 },
      { venueId: 'venue_shibuya_02', name: 'ComputeHub 道玄坂', address: '東京都渋谷区道玄坂2-10-12', timezone: 'Asia/Tokyo', latitude: 35.6571, longitude: 139.6967, amenities: ['Wi-Fi', 'GPU', 'ドリンクバー', 'シャワー'], openHours: '24時間営業', availableSeats: 5, totalSeats: 25, cheapestPlanMinor: 800 },
      { venueId: 'venue_shibuya_03', name: 'サイレントスペース 神南', address: '東京都渋谷区神南1-12-16', timezone: 'Asia/Tokyo', latitude: 35.6635, longitude: 139.6993, amenities: ['Wi-Fi', '個室', '電源'], openHours: '07:00〜23:00', availableSeats: 8, totalSeats: 15, cheapestPlanMinor: 300 },
      { venueId: 'venue_harajuku_01', name: 'NodeStation 原宿', address: '東京都渋谷区神宮前1-8-5', timezone: 'Asia/Tokyo', latitude: 35.6702, longitude: 139.7027, amenities: ['Wi-Fi', '電源', 'ドリンクバー'], openHours: '09:00〜22:00', availableSeats: 15, totalSeats: 30, cheapestPlanMinor: 400 },
      { venueId: 'venue_daikanyama_01', name: 'DeepWork 代官山', address: '東京都渋谷区代官山町17-6', timezone: 'Asia/Tokyo', latitude: 35.6488, longitude: 139.7034, amenities: ['Wi-Fi', '個室', '電源', 'カフェ'], openHours: '08:00〜22:00', availableSeats: 3, totalSeats: 10, cheapestPlanMinor: 600 },
      { venueId: 'venue_ebisu_01', name: 'GPUラボ 恵比寿', address: '東京都渋谷区恵比寿南1-5-5', timezone: 'Asia/Tokyo', latitude: 35.6467, longitude: 139.7101, amenities: ['Wi-Fi', 'GPU', 'ドリンクバー', '電源'], openHours: '24時間営業', availableSeats: 7, totalSeats: 20, cheapestPlanMinor: 700 },
      { venueId: 'venue_shibuya_04', name: 'ネットパーク 桜丘', address: '東京都渋谷区桜丘町22-14', timezone: 'Asia/Tokyo', latitude: 35.6548, longitude: 139.7010, amenities: ['Wi-Fi', 'ドリンクバー', 'シャワー', 'コミック'], openHours: '24時間営業', availableSeats: 20, totalSeats: 50, cheapestPlanMinor: 350 },
      { venueId: 'venue_omotesando_01', name: 'クリエイターズHQ 表参道', address: '東京都渋谷区神宮前4-9-2', timezone: 'Asia/Tokyo', latitude: 35.6659, longitude: 139.7093, amenities: ['Wi-Fi', 'GPU', '個室', 'カフェ', '電源'], openHours: '08:00〜23:00', availableSeats: 4, totalSeats: 12, cheapestPlanMinor: 1000 },
      { venueId: 'venue_shinsen_01', name: 'バジェットネット 神泉', address: '東京都渋谷区円山町5-3', timezone: 'Asia/Tokyo', latitude: 35.6567, longitude: 139.6926, amenities: ['Wi-Fi', '電源'], openHours: '10:00〜02:00', availableSeats: 25, totalSeats: 35, cheapestPlanMinor: 200 },
      { venueId: 'venue_yoyogi_01', name: 'NodeBase 代々木', address: '東京都渋谷区代々木1-30-1', timezone: 'Asia/Tokyo', latitude: 35.6833, longitude: 139.7020, amenities: ['Wi-Fi', 'GPU', '電源', 'ドリンクバー'], openHours: '24時間営業', availableSeats: 10, totalSeats: 28, cheapestPlanMinor: 450 },
    ];

    for (const v of venues) {
      this.venues.set(v.venueId, v);
    }

    const defaultPlans: PricePlanRecord[] = [
      { planId: 'plan_1h', venueId: 'venue_shibuya_01', name: '1時間パック', baseDurationMinutes: 60, basePriceMinor: 500, depositRequiredMinor: 200 },
      { planId: 'plan_3h', venueId: 'venue_shibuya_01', name: '3時間パック', baseDurationMinutes: 180, basePriceMinor: 1200, depositRequiredMinor: 500 },
      { planId: 'plan_night', venueId: 'venue_shibuya_01', name: 'ナイトパック', baseDurationMinutes: 480, basePriceMinor: 2000, depositRequiredMinor: 800 },
    ];
    for (const p of defaultPlans) {
      this.plans.set(p.planId, p);
    }

    this.seats.set('seat_demo', { seatId: 'seat_demo', venueId: 'venue_shibuya_01', type: 'BOOTH', status: 'AVAILABLE' });
  }

  listVenues(): VenueRecord[] {
    return [...this.venues.values()];
  }

  listPlansByVenue(venueId: string): PricePlanRecord[] {
    return [...this.plans.values()].filter((p) => p.venueId === venueId);
  }

  createVenue(input: { name: string; address: string; timezone: string; latitude?: number; longitude?: number; amenities?: string[]; openHours?: string }): VenueRecord {
    const venueId = this.id('venue');
    const v: VenueRecord = { venueId, latitude: input.latitude ?? 0, longitude: input.longitude ?? 0, ...input };
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
