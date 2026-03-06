export interface Broadcast {
  broadcastId: string;
  userId: string;
  productId: string;
  productName: string;
  category: string;
  userLat: number;
  userLng: number;
  radius: number;
  status: 'active' | 'expired' | 'fulfilled' | 'cancelled';
  timestamp: string;
  expiresAt: string;
}

export interface BroadcastResponse {
  responseId: string;
  broadcastId: string;
  merchantId: string;
  merchant?: {
    shopName: string;
    distance: number;
    rating?: number;
  };
  response: 'accept' | 'reject' | 'schedule';
  scheduledTime?: string;
  message?: string;
  timestamp: string;
}

export interface Offer {
  offerId: string;
  merchantId: string;
  productId: string;
  productName: string;
  image: string;
  description: string;
  price: number;
  originalPrice: number;
  discount: number;
  timing: string;
  validFrom: string;
  validUntil: string;
  lat: number;
  lng: number;
  radius: number;
  maxReservations: number;
  currentReservations: number;
  status: 'active' | 'expired' | 'soldout';
  createdAt: string;
  merchant?: {
    shopName: string;
    distance?: number;
    rating?: number;
  };
}

export interface Reservation {
  reservationId: string;
  offerId: string;
  userId: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  reservedAt: string;
  expiresAt: string;
}
