export interface Merchant {
  merchantId: string;
  userId: string;
  shopName: string;
  description?: string;
  address: string;
  mapsLink?: string;
  lat: number;
  lng: number;
  openTime: string;
  closeTime: string;
  categories: string[];
  status: 'pending' | 'verified' | 'rejected';
  photos: string[];
  rating?: number;
  totalOrders?: number;
  createdAt: string;
}
