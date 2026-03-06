/**
 * PassService: purchase; 结果/状态写入 pass.store（SPEC §7, S4）.
 */

import type { NodeStayClient } from '@nodestay/api-client';
import type { PurchasePassInput, PurchasePassResult } from '../models/pass.model';
import { usePassStore } from '../stores/pass.store';
import { createNodeStayClient } from './nodestay';

export const PassService = {
  async purchase(input: PurchasePassInput, idempotencyKey: string, client?: NodeStayClient): Promise<PurchasePassResult> {
    const c = client ?? createNodeStayClient();
    const set = usePassStore.getState();
    set.setLoading(true);
    set.setError(null);
    try {
      const data = (await c.purchasePass(
        { planId: input.planId, venueId: input.venueId, paymentMethod: input.paymentMethod },
        idempotencyKey,
      )) as { ledgerTxId: string; passId: string };
      const result: PurchasePassResult = { ledgerTxId: data.ledgerTxId, passId: data.passId };
      set.setLastPurchase(result);
      set.setLoading(false);
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Purchase failed';
      set.setError(msg);
      set.setLoading(false);
      throw e;
    }
  },
};
