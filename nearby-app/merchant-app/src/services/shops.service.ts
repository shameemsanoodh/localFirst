const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/dev';

export interface Shop {
  shopId: string;
  name: string;
  category: string;
  description: string;
  coverImage: string;
  logo: string;
  rating: number;
  totalReviews: number;
  openTime: string;
  closeTime: string;
  location: {
    lat: number;
    lng: number;
    address: string;
    area: string;
  };
  tags: string[];
  isVerified: boolean;
  distanceKm: number;
  isOpen: boolean;
}

export interface NearbyShopsResponse {
  shops: Shop[];
  count: number;
  userLocation: {
    lat: number;
    lng: number;
  };
  radius: number;
}

export const shopsService = {
  /**
   * Get nearby shops based on user location
   */
  async getNearbyShops(
    lat: number,
    lng: number,
    radius: number = 3
  ): Promise<NearbyShopsResponse> {
    try {
      const response = await fetch(
        `${API_URL}/shops/nearby?lat=${lat}&lng=${lng}&radius=${radius}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch nearby shops');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching nearby shops:', error);
      throw error;
    }
  },

  /**
   * Get nearby shops (returns just the shops array)
   */
  async getNearby(lat: number, lng: number, radius: number = 3): Promise<Shop[]> {
    try {
      const data = await this.getNearbyShops(lat, lng, radius);
      return data.shops || [];
    } catch (error) {
      console.error('Failed to fetch nearby shops:', error);
      return [];
    }
  },

  /**
   * Get nearby shops filtered by category
   */
  async getNearbyByCategory(
    lat: number,
    lng: number,
    category: string,
    radius: number = 3
  ): Promise<Shop[]> {
    try {
      const shops = await this.getNearby(lat, lng, radius);
      return shops.filter(shop => shop.category === category);
    } catch (error) {
      console.error('Failed to fetch nearby shops by category:', error);
      return [];
    }
  },
};
