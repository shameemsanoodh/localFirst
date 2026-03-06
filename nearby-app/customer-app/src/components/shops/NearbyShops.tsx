import React, { useEffect, useState } from 'react';
import { ShopCard } from './ShopCard';
import { ShopCardSkeleton } from './ShopCardSkeleton';
import { Shop, shopsService } from '@/services/shops.service';
import { useLocationStore } from '@/store/locationStore';
import { MapPin, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const NearbyShops: React.FC = () => {
  const { lat, lng, area } = useLocationStore();
  const navigate = useNavigate();
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lat && lng) {
      fetchNearbyShops();
    }
  }, [lat, lng]);

  const fetchNearbyShops = async () => {
    if (!lat || !lng) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await shopsService.getNearbyShops(lat, lng, 3);
      setShops(response.shops);
    } catch (err) {
      console.error('Error fetching shops:', err);
      setError('Could not load shops. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // If location not set, show enable location message
  if (!lat || !lng) {
    return (
      <section className="py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Shops Near You</h2>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
          <MapPin size={48} className="mx-auto text-blue-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Enable location to see nearby shops
          </h3>
          <p className="text-gray-600">
            Click "Use my current location" in the search bar above to discover shops around you
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-6">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Shops Near You</h2>
          <p className="text-sm text-gray-600 mt-1">
            Within 3 km of {area || 'your location'}
          </p>
        </div>
        <button
          onClick={() => navigate('/shops')}
          className="text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          View All
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ShopCardSkeleton />
          <ShopCardSkeleton />
          <ShopCardSkeleton />
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {error}
          </h3>
          <button
            onClick={fetchNearbyShops}
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && shops.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
          <div className="text-6xl mb-4">🏪</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No shops found nearby
          </h3>
          <p className="text-gray-600">
            Try increasing the search radius or check back later
          </p>
        </div>
      )}

      {/* Shops Grid */}
      {!isLoading && !error && shops.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map((shop) => (
            <ShopCard
              key={shop.shopId}
              shop={shop}
              onClick={() => navigate(`/shop/${shop.shopId}`)}
            />
          ))}
        </div>
      )}
    </section>
  );
};
