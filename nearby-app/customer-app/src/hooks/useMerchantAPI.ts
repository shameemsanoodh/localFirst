import { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://jkr38eejve.execute-api.ap-south-1.amazonaws.com/production';

export interface MerchantRegistrationData {
  owner_phone: string;
  shop_name: string;
  major_category: string;
  sub_category: string;
  capabilities_enabled: string[];
  location: {
    lat: number;
    lng: number;
  };
  whatsapp?: string;
  shop_images?: string[];
}

export interface Broadcast {
  broadcast_id: string;
  user_id: string;
  query: string;
  detected_capabilities: string[];
  detected_category: string;
  location: { lat: number; lng: number };
  radius_km: number;
  status: string;
  matched_shops_count: number;
  responses_count: number;
  created_at: number;
  expires_at: number;
}

export interface BroadcastResponse {
  shop_id: string;
  shop_name: string;
  response_type: 'yes' | 'no' | 'alternative';
  message?: string;
  price?: number;
  availability?: 'in_stock' | 'out_of_stock' | 'order_available';
}

export const useMerchantAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerMerchant = async (data: MerchantRegistrationData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/merchants/register`, data);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to register merchant');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getBroadcasts = async (shopId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/broadcasts?shop_id=${shopId}`);
      return response.data.broadcasts as Broadcast[];
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch broadcasts');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const replyToBroadcast = async (broadcastId: string, responseData: BroadcastResponse) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/broadcasts/${broadcastId}/reply`,
        responseData
      );
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send response');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getCapabilities = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/capabilities`);
      return response.data.capabilities;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch capabilities');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    registerMerchant,
    getBroadcasts,
    replyToBroadcast,
    getCapabilities
  };
};
