import { Injectable } from '@nestjs/common';
import crypto from 'node:crypto';
import type { IdempotencyKey } from '@nodestay/domain';

type Stored = { requestHash: string; response: any };

@Injectable()
export class IdempotencyService {
  private readonly store = new Map<IdempotencyKey, Stored>();

  hashRequest(input: unknown): string {
    const json = JSON.stringify(input);
    return crypto.createHash('sha256').update(json).digest('hex');
  }

  get(key: IdempotencyKey): Stored | undefined {
    return this.store.get(key);
  }

  save(key: IdempotencyKey, requestHash: string, response: { ledgerTxId: string }) {
    this.store.set(key, { requestHash, response });
  }
}
