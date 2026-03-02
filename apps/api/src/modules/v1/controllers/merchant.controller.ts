import { Body, Controller, HttpException, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { z } from 'zod';
import { StoreService } from '../services/store.service';

const CreateVenueBodySchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  timezone: z.string().min(1),
});

const UpsertPlanBodySchema = z.object({
  planId: z.string().min(1).optional(),
  name: z.string().min(1),
  baseDurationMinutes: z.number().int().positive(),
  basePriceMinor: z.number().int().nonnegative(),
  depositRequiredMinor: z.number().int().nonnegative(),
});

const UpsertSeatBodySchema = z.object({
  seatId: z.string().min(1).optional(),
  type: z.enum(['OPEN', 'BOOTH', 'FLAT', 'VIP']),
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'COMPUTE_MODE']).optional(),
});

const EnableComputeBodySchema = z.object({
  enable: z.boolean().default(true),
  // 将来的には availableWindows 等をここで受け取る
});

const CreateDisputeBodySchema = z.object({
  venueId: z.string().min(1),
  reason: z.string().min(1),
});

@Controller('/v1/merchant')
export class MerchantController {
  constructor(private readonly store: StoreService) {}

  @Post('/venues')
  createVenue(@Body() body: unknown) {
    const parsed = CreateVenueBodySchema.safeParse(body);
    if (!parsed.success) throw new HttpException({ message: '入力が不正です' }, HttpStatus.BAD_REQUEST);
    return this.store.createVenue(parsed.data);
  }

  @Put('/venues/:venueId/plans')
  upsertPlan(@Param('venueId') venueId: string, @Body() body: unknown) {
    const parsed = UpsertPlanBodySchema.safeParse(body);
    if (!parsed.success) throw new HttpException({ message: '入力が不正です' }, HttpStatus.BAD_REQUEST);
    return this.store.upsertPlan({ venueId, ...parsed.data });
  }

  @Post('/venues/:venueId/seats')
  createSeat(@Param('venueId') venueId: string, @Body() body: unknown) {
    const parsed = UpsertSeatBodySchema.safeParse(body);
    if (!parsed.success) throw new HttpException({ message: '入力が不正です' }, HttpStatus.BAD_REQUEST);
    return this.store.upsertSeat({ venueId, ...parsed.data });
  }

  @Put('/venues/:venueId/seats')
  upsertSeat(@Param('venueId') venueId: string, @Body() body: unknown) {
    const parsed = UpsertSeatBodySchema.safeParse(body);
    if (!parsed.success) throw new HttpException({ message: '入力が不正です' }, HttpStatus.BAD_REQUEST);
    return this.store.upsertSeat({ venueId, ...parsed.data });
  }

  @Post('/venues/:venueId/compute/enable')
  enableCompute(@Param('venueId') venueId: string, @Body() body: unknown) {
    const parsed = EnableComputeBodySchema.safeParse(body);
    if (!parsed.success) throw new HttpException({ message: '入力が不正です' }, HttpStatus.BAD_REQUEST);
    if (parsed.data.enable) this.store.enableComputeForVenue(venueId);
    return { venueId, computeEnabled: this.store.computeEnabled(venueId) };
  }

  @Post('/disputes')
  createDispute(@Body() body: unknown) {
    const parsed = CreateDisputeBodySchema.safeParse(body);
    if (!parsed.success) throw new HttpException({ message: '入力が不正です' }, HttpStatus.BAD_REQUEST);
    return this.store.createDispute(parsed.data);
  }
}

