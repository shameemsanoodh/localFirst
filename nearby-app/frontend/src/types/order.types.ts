export interface Order {
  orderId: string;
  userId: string;
  merchantId: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  status: 'pending' | 'approved' | 'pickedup' | 'completed' | 'cancelled';
  timestamp: string;
  updatedAt: string;
}

export interface Offer {
  offerId: string;
  merchantId: string;
  productId: string;
  productName: string;
  image: string;
  price: number;
  originalPrice: number;
  timing: string;
  radius: number;
  merchantLat: number;
  merchantLng: number;
  expiresAt: string;
  views: number;
  clicks: number;
  likes: number;
  reservations: string[];
}
