/**
 * VenueService: 拉取门店/套餐数据并写入 venue.store（SPEC §8.1）。
 * Controller 只读 Store、通过本 Service 触发拉数。
 */

import { createNodeStayClient } from './nodestay';
import { getVenueStore, setVenueStore } from '../stores/venue.store';
import type { VenueSortBy } from '../stores/venue.store';

export const VenueService = {
  setQuery(query: string) {
    setVenueStore({ query });
  },

  setSortBy(sortBy: VenueSortBy) {
    setVenueStore({ sortBy });
  },

  /** 拉取门店列表并写入 store（原始列表）；筛选/排序由 Controller 在 hook 内完成。 */
  async listVenues(): Promise<void> {
    setVenueStore({ loading: true });
    const minDelay = new Promise((r) => setTimeout(r, 600));
    try {
      const client = createNodeStayClient();
      const [venues] = await Promise.all([client.listVenues(), minDelay]);
      setVenueStore({ venues, loading: false, error: null });
    } catch (e) {
      await minDelay;
      setVenueStore({
        loading: false,
        error: e instanceof Error ? e.message : '取得に失敗しました',
      });
    }
  },

  async loadVenueDetail(venueId: string): Promise<void> {
    setVenueStore({ plansLoading: true, plansError: null });
    try {
      const client = createNodeStayClient();
      const [venues, plans] = await Promise.all([
        client.listVenues(),
        client.listPlans(venueId),
      ]);
      const venue = venues.find((v) => v.venueId === venueId) ?? null;
      setVenueStore({
        currentVenue: venue,
        plans,
        plansLoading: false,
        plansError: null,
      });
    } catch (e) {
      setVenueStore({
        plansLoading: false,
        plansError: e instanceof Error ? e.message : '取得に失敗しました',
      });
    }
  },
};
