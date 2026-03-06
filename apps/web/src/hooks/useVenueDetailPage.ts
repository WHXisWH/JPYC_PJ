/**
 * useVenueDetailPage: 店舗詳細 Controller（SPEC §8）。
 * 只读 venue.store、调用 VenueService / PassService；View 仅通过本 Hook 的返回值展示。
 */

import { useEffect, useState } from 'react';
import { useVenueStore } from '../stores/venue.store';
import { VenueService } from '../services/venue.service';
import { PassService } from '../services/pass.service';
import type { VenueListItem, PlanListItem } from '../models/venue.model';

export interface UseVenueDetailPageReturn {
  venue: VenueListItem | null;
  plans: PlanListItem[];
  loading: boolean;
  error: boolean;
  refresh: () => void;
  selectedPlan: PlanListItem | null;
  setSelectedPlan: (p: PlanListItem | null) => void;
  purchasing: boolean;
  purchaseSuccess: boolean;
  handlePurchase: () => Promise<void>;
}

export function useVenueDetailPage(venueId: string | undefined): UseVenueDetailPageReturn {
  const {
    currentVenue,
    plans,
    plansLoading,
    plansError,
  } = useVenueStore();
  const [selectedPlan, setSelectedPlan] = useState<PlanListItem | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  useEffect(() => {
    if (venueId) VenueService.loadVenueDetail(venueId);
  }, [venueId]);

  const handlePurchase = async () => {
    if (!selectedPlan || !venueId) return;
    setPurchasing(true);
    try {
      await PassService.purchase(
        { planId: selectedPlan.planId, venueId, paymentMethod: 'JPYC' },
        `purchase-${selectedPlan.planId}-${Date.now()}`
      );
      setPurchaseSuccess(true);
      setSelectedPlan(null);
    } catch {
      alert('購入処理に失敗しました。JPYC残高を確認してください。');
    } finally {
      setPurchasing(false);
    }
  };

  return {
    venue: currentVenue ?? null,
    plans,
    loading: plansLoading,
    error: !!plansError,
    refresh: () => venueId && VenueService.loadVenueDetail(venueId),
    selectedPlan,
    setSelectedPlan,
    purchasing,
    purchaseSuccess,
    handlePurchase,
  };
}
