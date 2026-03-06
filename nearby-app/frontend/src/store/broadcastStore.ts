import { create } from 'zustand';
import type { Broadcast, BroadcastResponse } from '@/types/broadcast.types';

interface BroadcastState {
  activeBroadcast: Broadcast | null;
  responses: BroadcastResponse[];
  isSearching: boolean;
  setActiveBroadcast: (broadcast: Broadcast) => void;
  addResponse: (response: BroadcastResponse) => void;
  setSearching: (searching: boolean) => void;
  clearBroadcast: () => void;
  clearActiveBroadcast: () => void;
}

export const useBroadcastStore = create<BroadcastState>((set) => ({
  activeBroadcast: null,
  responses: [],
  isSearching: false,
  setActiveBroadcast: (broadcast) => set({ activeBroadcast: broadcast, responses: [] }),
  addResponse: (response) =>
    set((state) => ({ responses: [...state.responses, response] })),
  setSearching: (searching) => set({ isSearching: searching }),
  clearBroadcast: () =>
    set({ activeBroadcast: null, responses: [], isSearching: false }),
  clearActiveBroadcast: () =>
    set({ activeBroadcast: null, responses: [], isSearching: false }),
}));
