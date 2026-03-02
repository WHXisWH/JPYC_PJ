import { Module } from '@nestjs/common';
import { HealthController } from './controllers/health.controller';
import { PassesController } from './controllers/passes.controller';
import { IdentityController } from './controllers/identity.controller';
import { SessionsController } from './controllers/sessions.controller';
import { UserController } from './controllers/user.controller';
import { VenuesController } from './controllers/venues.controller';
import { MerchantController } from './controllers/merchant.controller';
import { ComputeController } from './controllers/compute.controller';
import { IdempotencyService } from './services/idempotency.service';
import { LedgerService } from './services/ledger.service';
import { StoreService } from './services/store.service';
import { FeatureFlagsService } from './services/featureFlags.service';

@Module({
  controllers: [
    HealthController,
    VenuesController,
    PassesController,
    IdentityController,
    SessionsController,
    UserController,
    MerchantController,
    ComputeController,
  ],
  providers: [FeatureFlagsService, StoreService, IdempotencyService, LedgerService],
})
export class V1Module {}
