import { Body, Controller, Headers, HttpException, HttpStatus, Param, Post } from '@nestjs/common';
import { z } from 'zod';
import { normalizeIdempotencyKey } from '@nodestay/domain';
import { IdempotencyService } from '../services/idempotency.service';
import { LedgerService } from '../services/ledger.service';
import { StoreService } from '../services/store.service';
import { FeatureFlagsService } from '../services/featureFlags.service';

const PurchasePassBodySchema = z.object({
  planId: z.string().min(1),
  venueId: z.string().min(1),
  paymentMethod: z.literal('JPYC'),
});
type PurchasePassBody = z.infer<typeof PurchasePassBodySchema>;

@Controller('/v1/passes')
export class PassesController {
  constructor(
    private readonly idempotency: IdempotencyService,
    private readonly ledger: LedgerService,
    private readonly store: StoreService,
    private readonly flags: FeatureFlagsService,
  ) {}

  @Post('/purchase')
  async purchase(
    @Body() body: PurchasePassBody,
    @Headers('idempotency-key') rawIdempotencyKey: string | undefined,
  ): Promise<{ ledgerTxId: string }> {
    const parsed = PurchasePassBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpException({ message: '入力が不正です' }, HttpStatus.BAD_REQUEST);
    }
    if (!rawIdempotencyKey) {
      throw new HttpException({ message: 'Idempotency-Key が必要です' }, HttpStatus.BAD_REQUEST);
    }

    let key: ReturnType<typeof normalizeIdempotencyKey>;
    try {
      key = normalizeIdempotencyKey(rawIdempotencyKey);
    } catch {
      throw new HttpException({ message: 'Idempotency-Key が不正です' }, HttpStatus.BAD_REQUEST);
    }
    const requestHash = this.idempotency.hashRequest(parsed.data);

    const existing = this.idempotency.get(key);
    if (existing) {
      if (existing.requestHash !== requestHash) {
        throw new HttpException({ message: '同一キーで内容が異なります' }, HttpStatus.CONFLICT);
      }
      return existing.response;
    }

    const ledgerTxId = this.ledger.createPurchaseTx({
      planId: parsed.data.planId,
      venueId: parsed.data.venueId,
      currency: 'JPYC',
      amountMinor: 0,
    });

    const pass = this.store.createPass({
      ownerUserId: 'user_demo',
      planId: parsed.data.planId,
      venueId: parsed.data.venueId,
      depositAmountMinor: 0,
    });
    const response = { ledgerTxId, passId: pass.passId };
    this.idempotency.save(key, requestHash, response);
    return response;
  }

  @Post('/:passId/transfer')
  async transfer(@Param('passId') passId: string, @Headers('idempotency-key') rawKey: string | undefined) {
    if (!this.flags.transferMarketEnabled()) {
      throw new HttpException({ message: '譲渡機能は無効です' }, HttpStatus.NOT_IMPLEMENTED);
    }
    if (!rawKey) throw new HttpException({ message: 'Idempotency-Key が必要です' }, HttpStatus.BAD_REQUEST);
    let key: ReturnType<typeof normalizeIdempotencyKey>;
    try {
      key = normalizeIdempotencyKey(rawKey);
    } catch {
      throw new HttpException({ message: 'Idempotency-Key が不正です' }, HttpStatus.BAD_REQUEST);
    }

    const requestHash = this.idempotency.hashRequest({ passId });
    const existing = this.idempotency.get(key);
    if (existing) {
      if (existing.requestHash !== requestHash) {
        throw new HttpException({ message: '同一キーで内容が異なります' }, HttpStatus.CONFLICT);
      }
      return existing.response;
    }

    const p = this.store.transferPass(passId);
    if (!p) throw new HttpException({ message: 'パスが見つかりません' }, HttpStatus.NOT_FOUND);
    const response = { passId: p.passId, status: p.status };
    this.idempotency.save(key, requestHash, response);
    return response;
  }
}
