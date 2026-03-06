import { create } from 'zustand';

interface LocationState {
  lat: number | null;
  lng: number | null;
  city: string;
  area: string;
  state: string;
  location: { lat: number; lng: number } | null;
  setLocation: (lat: number, lng: number, city?: string, area?: string) => void;
  clearLocation: () => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  lat: null, // No default location - user must select
  lng: null,
  city: '',
  area: '',
  state: '',
  location: null,
  setLocation: (lat, lng, city = '', area = '') =>
    set({ lat, lng, city, area, location: { lat, lng } }),
  clearLocation: () =>
    set({ lat: null, lng: null, city: '', area: '', state: '', location: null }),
}));
