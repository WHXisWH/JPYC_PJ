import { Body, Controller, Headers, HttpException, HttpStatus, Post } from '@nestjs/common';
import { z } from 'zod';
import { normalizeIdempotencyKey } from '@nodestay/domain';
import { IdempotencyService } from '../services/idempotency.service';
import { StoreService } from '../services/store.service';

const CheckInBodySchema = z.object({
  passId: z.string().min(1),
  seatId: z.string().min(1),
  venueId: z.string().min(1),
  identityVerificationId: z.string().min(1).optional(),
});

const CheckoutBodySchema = z.object({
  sessionId: z.string().min(1),
});

@Controller('/v1/sessions')
export class SessionsController {
  constructor(
    private readonly store: StoreService,
    private readonly idempotency: IdempotencyService,
  ) {}

  @Post('/checkin')
  checkin(@Body() body: unknown) {
    const parsed = CheckInBodySchema.safeParse(body);
    if (!parsed.success) throw new HttpException({ message: '入力が不正です' }, HttpStatus.BAD_REQUEST);

    const pass = this.store.getPass(parsed.data.passId);
    if (!pass) throw new HttpException({ message: 'パスが見つかりません' }, HttpStatus.NOT_FOUND);
    const s = this.store.startSession({
      passId: parsed.data.passId,
      seatId: parsed.data.seatId,
      venueId: parsed.data.venueId,
    });
    return { sessionId: s.sessionId };
  }

  @Post('/checkout')
  checkout(@Body() body: unknown, @Headers('idempotency-key') rawKey: string | undefined) {
    const parsed = CheckoutBodySchema.safeParse(body);
    if (!parsed.success) throw new HttpException({ message: '入力が不正です' }, HttpStatus.BAD_REQUEST);
    if (!rawKey) throw new HttpException({ message: 'Idempotency-Key が必要です' }, HttpStatus.BAD_REQUEST);

    let key: ReturnType<typeof normalizeIdempotencyKey>;
    try {
      key = normalizeIdempotencyKey(rawKey);
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

    const ended = this.store.endSession(parsed.data.sessionId);
    if (!ended) throw new HttpException({ message: 'セッションが見つかりません' }, HttpStatus.NOT_FOUND);

    const response = { usedMinutes: 0, charges: { baseMinor: 0, overtimeMinor: 0, amenitiesMinor: 0, damageMinor: 0 } };
    this.idempotency.save(key, requestHash, response as any);
    return response;
  }
}

