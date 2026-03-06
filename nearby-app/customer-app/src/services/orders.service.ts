import api from './api';
import type { Order } from '@/types/order.types';

interface CreateOrderRequest {
  merchantId: string;
  productId: string;
  quantity: number;
  broadcastId?: string;
  notes?: string;
}

export const ordersService = {
  async create(data: CreateOrderRequest): Promise<Order> {
    const response = await api.post<Order>('/orders', data);
    return response.data;
  },

  async getById(orderId: string): Promise<Order> {
    const response = await api.get<Order>(`/orders/${orderId}`);
    return response.data;
  },

  async updateStatus(
    orderId: string,
    status: 'pending' | 'approved' | 'pickedup' | 'completed' | 'cancelled'
  ): Promise<Order> {
    const response = await api.put<Order>(`/orders/${orderId}/status`, { status });
    return response.data;
  },

  async getUserOrders(userId: string, page = 1): Promise<Order[]> {
    const response = await api.get<{ orders: Order[] }>(
      `/orders/user/${userId}?page=${page}`
    );
    return response.data.orders;
  },

  async getMerchantOrders(status?: string): Promise<Order[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('view', 'merchant');
    
    const response = await api.get<{ orders: Order[] }>(
      `/orders?${params}`
    );
    return response.data.orders;
  },
};
