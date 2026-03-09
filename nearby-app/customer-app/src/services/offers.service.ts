import api from './api';
import type { Offer, Reservation } from '@/types/broadcast.types';

interface CreateOfferRequest {
  productId: string;
  productName: string;
  image: string;
  description: string;
  price: number;
  originalPrice: number;
  timing: string;
  validFrom: string;
  validUntil: string;
  radius: number;
  maxReservations: number;
}

interface NearbyOffersRequest {
  lat: number;
  lng: number;
  radius?: number;
  categoryId?: string;
}

export const offersService = {
  async create(data: CreateOfferRequest): Promise<Offer> {
    const response = await api.post<Offer>('/offers', data);
    return response.data;
  },

  async getNearby(params: NearbyOffersRequest): Promise<Offer[]> {
    try {
      const queryParams = new URLSearchParams({
        lat: params.lat.toString(),
        lng: params.lng.toString(),
        radius: (params.radius || 5).toString(),
      });
      if (params.categoryId) queryParams.append('categoryId', params.categoryId);

      const response = await api.get<{ offers: Offer[] }>(`/offers/nearby?${queryParams}`);
      
      // Ensure we always return an array, never undefined
      return response.data?.offers ?? [];
    } catch (error) {
      console.error('Failed to fetch nearby offers:', error);
      return []; // Return empty array on error
    }
  },

  async getById(offerId: string): Promise<Offer> {
    const response = await api.get<Offer>(`/offers/${offerId}`);
    return response.data;
  },

  async reserve(offerId: string): Promise<Reservation> {
    const response = await api.post<Reservation>(`/offers/${offerId}/reserve`);
    return response.data;
  },

  async like(offerId: string): Promise<void> {
    await api.post(`/offers/${offerId}/like`);
  },

  async unlike(offerId: string): Promise<void> {
    await api.delete(`/offers/${offerId}/like`);
  },

  async getMerchantOffers(merchantId: string): Promise<Offer[]> {
    const response = await api.get<{ offers: Offer[] }>(`/merchants/${merchantId}/offers`);
    return response.data.offers;
  },
};
