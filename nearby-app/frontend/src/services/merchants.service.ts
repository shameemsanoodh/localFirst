import api from './api';
import type { Merchant } from '@/types/merchant.types';
import type { Offer } from '@/types/broadcast.types';

interface CreateMerchantRequest {
  shopName: string;
  description: string;
  address: string;
  mapsLink: string;
  lat: number;
  lng: number;
  openTime: string;
  closeTime: string;
  categories: string[];
  photos: string[];
}

interface NearbyMerchantsRequest {
  lat: number;
  lng: number;
  radius?: number;
  categoryId?: string;
}

export const merchantsService = {
  async create(data: CreateMerchantRequest): Promise<Merchant> {
    const response = await api.post<Merchant>('/merchants', data);
    return response.data;
  },

  async getById(merchantId: string): Promise<Merchant> {
    const response = await api.get<Merchant>(`/merchants/${merchantId}`);
    return response.data;
  },

  async update(merchantId: string, data: Partial<CreateMerchantRequest>): Promise<Merchant> {
    const response = await api.put<Merchant>(`/merchants/${merchantId}`, data);
    return response.data;
  },

  async getNearby(params: NearbyMerchantsRequest): Promise<Merchant[]> {
    const queryParams = new URLSearchParams({
      lat: params.lat.toString(),
      lng: params.lng.toString(),
      radius: (params.radius || 5).toString(),
    });
    if (params.categoryId) queryParams.append('categoryId', params.categoryId);

    const response = await api.get<{ merchants: Merchant[] }>(
      `/merchants/nearby?${queryParams}`
    );
    return response.data.merchants;
  },

  async getProfile(): Promise<Merchant> {
    const response = await api.get<{ merchant: Merchant }>('/merchant/profile');
    return response.data.merchant;
  },

  async getOffers(): Promise<Offer[]> {
    const response = await api.get<{ offers: Offer[] }>('/merchant/offers');
    return response.data.offers;
  },
};

