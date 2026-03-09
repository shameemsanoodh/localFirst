import React from 'react';
import { OfferCard } from '@/components/offers/OfferCard';
import api from '@/services/api';

interface ActiveOffer {
  offerId: string;
  shopName: string;
  offer: string;
  message: string;
  category: string;
  distance: number;
  expiresAt: number;
  location?: {
    lat: number;
    lng: number;
  };
}

const TestOffers: React.FC = () => {
  const [offers, setOffers] = React.useState<ActiveOffer[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Hardcoded location for testing
  const lat = 12.9787757;
  const lng = 77.5513751;

  React.useEffect(() => {
    const fetchOffers = async () => {
      try {
        console.log('🔍 Fetching offers from:', `/offers/active?lat=${lat}&lng=${lng}&radius=10`);
        const response = await api.get<{ offers: ActiveOffer[] }>(
          `/offers/active?lat=${lat}&lng=${lng}&radius=10`
        );
        console.log('✅ Response:', response);
        console.log('📦 Response data:', response.data);
        console.log('🎁 Offers:', (response.data as any)?.data?.offers || (response.data as any)?.offers);
        
        // Handle nested data structure from backend
        const offersData = (response.data as any)?.data?.offers || (response.data as any)?.offers || [];
        setOffers(offersData);
        setLoading(false);
      } catch (err: any) {
        console.error('❌ Error:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchOffers();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading offers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 max-w-md">
          <h2 className="text-xl font-bold text-red-900 mb-2">Error Loading Offers</h2>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Test Merchant Offers</h1>
          <p className="text-gray-600">
            Location: {lat}, {lng} | Offers found: {offers.length}
          </p>
        </div>

        {offers.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Offers Available</h2>
            <p className="text-gray-600">No merchant offers found for this location</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((offer) => (
              <OfferCard
                key={offer.offerId}
                offer={offer}
                userLocation={{ lat, lng }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestOffers;
