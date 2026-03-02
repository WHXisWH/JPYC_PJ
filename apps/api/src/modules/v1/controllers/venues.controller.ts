import { Controller, Get, Param } from '@nestjs/common';
import { StoreService } from '../services/store.service';

@Controller('/v1/venues')
export class VenuesController {
  constructor(private readonly store: StoreService) {}

  @Get()
  list() {
    return this.store.listVenues();
  }

  @Get('/:venueId/plans')
  plans(@Param('venueId') venueId: string) {
    return this.store.listPlansByVenue(venueId);
  }
}

