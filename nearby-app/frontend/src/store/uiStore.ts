import { create } from 'zustand';

interface UIState {
  showSplash: boolean;
  isLoading: boolean;
  toast: {
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  };
  setShowSplash: (show: boolean) => void;
  setLoading: (loading: boolean) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  showSplash: true,
  isLoading: false,
  toast: {
    show: false,
    message: '',
    type: 'info',
  },
  setShowSplash: (show) => set({ showSplash: show }),
  setLoading: (loading) => set({ isLoading: loading }),
  showToast: (message, type) =>
    set({ toast: { show: true, message, type } }),
  hideToast: () =>
    set((state) => ({ toast: { ...state.toast, show: false } })),
}));
