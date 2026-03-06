import api from './api';
import type { Broadcast, BroadcastResponse } from '@/types/broadcast.types';

interface CreateBroadcastRequest {
  productId: string;
  productName: string;
  category?: string;
  userLat: number;
  userLng: number;
  radius: number;
}

interface CategoryFilteredBroadcastRequest {
  query: string;
  detectedCategory: string;
  userLat: number;
  userLng: number;
  radius: number;
  locality: string;
}

interface BroadcastDetailResponse {
  broadcast: Broadcast;
  responses: BroadcastResponse[];
}

interface RespondToBroadcastRequest {
  response: 'accept' | 'reject' | 'schedule';
  scheduledTime?: string;
  price?: number;
  notes?: string;
}

export const broadcastService = {
  /**
   * Create a category-filtered broadcast
   * Only broadcasts to shops matching the detected category within radius
   */
  async createCategoryFiltered(data: CategoryFilteredBroadcastRequest): Promise<{
    broadcast: Broadcast;
    matchedShopsCount: number;
  }> {
    const response = await api.post<{
      success: boolean;
      data: { broadcast: Broadcast; matchedShopsCount: number };
    }>('/broadcasts/category-filtered', data);
    return response.data.data;
  },
  async create(data: CreateBroadcastRequest): Promise<Broadcast> {
    const response = await api.post<Broadcast>('/broadcasts', data);
    return response.data;
  },

  async getById(broadcastId: string): Promise<BroadcastDetailResponse> {
    const response = await api.get<BroadcastDetailResponse>(`/broadcasts/${broadcastId}`);
    return response.data;
  },

  async cancel(broadcastId: string): Promise<void> {
    await api.put(`/broadcasts/${broadcastId}/cancel`);
  },

  async getUserBroadcasts(userId: string, status?: string, page = 1): Promise<Broadcast[]> {
    const params = new URLSearchParams({ page: page.toString() });
    if (status) params.append('status', status);
    
    const response = await api.get<{ broadcasts: Broadcast[] }>(
      `/broadcasts/user/${userId}?${params}`
    );
    return response.data.broadcasts;
  },

  async getMerchantBroadcasts(): Promise<Broadcast[]> {
    const response = await api.get<{ broadcasts: Broadcast[] }>(
      `/merchant/broadcasts`
    );
    return response.data.broadcasts;
  },

  async respond(broadcastId: string, data: RespondToBroadcastRequest): Promise<BroadcastResponse> {
    const response = await api.post<BroadcastResponse>(
      `/broadcasts/${broadcastId}/responses`,
      data
    );
    return response.data;
  },
};
