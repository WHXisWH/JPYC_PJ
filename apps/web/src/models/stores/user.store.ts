/**
 * User store.
 * balance 等由 UserService 写入；Controller 只读（可选）（SPEC §9、TODO M17）。
 */

import { create } from 'zustand';
import type { Balance } from '../user.model';

export interface UserState {
  balance: Balance | null;
  loading: boolean;
  error: string | null;
}

export interface UserActions {
  setBalance: (balance: Balance | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

const initialState: UserState = {
  balance: null,
  loading: false,
  error: null,
};

export const useUserStore = create<UserState & UserActions>((set) => ({
  ...initialState,
  setBalance: (balance) => set({ balance, error: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
  clearError: () => set({ error: null }),
}));
