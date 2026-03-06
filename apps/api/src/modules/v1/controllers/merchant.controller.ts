import { Body, Controller, HttpException, HttpStatus, Param, Post, Put } from '@nestjs/common';
import {
  CreateVenueBodySchema,
  UpsertPlanBodySchema,
  UpsertSeatBodySchema,
  EnableComputeBodySchema,
  CreateDisputeBodySchema,
} from '../contracts';
import { StoreService } from '../services/store.service';

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

