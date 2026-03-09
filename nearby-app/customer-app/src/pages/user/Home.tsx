import React from 'react';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { EnhancedHeroSection } from '@/components/home/EnhancedHeroSection';
import { NearbyOffers } from '@/components/home/NearbyOffers';
import { NearbyShops } from '@/components/shops/NearbyShops';
import { OfferCard } from '@/components/offers/OfferCard';
import { useLocationStore } from '@/store/locationStore';
import { useOffers } from '@/hooks/useOffers';
import { useCategories } from '@/hooks/useCategories';
import { useNavigate } from 'react-router-dom';
import { Store, Tag } from 'lucide-react';
import api from '@/services/api';

interface ActiveOffer {
  offerId: string
  shopName: string
  offer: string
  message: string
  category: string
  distance: number
  expiresAt: number
  location?: {
    lat: number
    lng: number
  }
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { lat, lng } = useLocationStore();
  const [merchantOffers, setMerchantOffers] = React.useState<ActiveOffer[]>([]);
  
  // Fetch real data using hooks
  const { offers, isLoading: isLoadingOffers } = useOffers({
    lat: lat,
    lng: lng,
    radius: 5,
  });

  const { categories, isLoading: isLoadingCategories } = useCategories();

  // Fetch merchant broadcast offers
  React.useEffect(() => {
    const fetchMerchantOffers = async () => {
      if (!lat || !lng) {
        console.log('⚠️ No location available for fetching merchant offers');
        return;
      }
      try {
        console.log('🔍 Fetching merchant offers for location:', { lat, lng });
        const response = await api.get<{ offers: ActiveOffer[] }>(`/offers/active?lat=${lat}&lng=${lng}&radius=10`);
        console.log('✅ Merchant offers received:', response.data);
        // Handle nested data structure from backend
        const offersData = (response.data as any)?.data?.offers || (response.data as any)?.offers || [];
        setMerchantOffers(offersData);
      } catch (err) {
        console.error('❌ Error fetching merchant offers:', err);
      }
    };
    fetchMerchantOffers();
  }, [lat, lng]);

  // Debug log
  console.log('🎯 Home component render - Merchant offers count:', merchantOffers.length, merchantOffers);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* No header - location is now in hero section */}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-5 space-y-6">
        {/* Enhanced Hero Section with Inline Search */}
        <EnhancedHeroSection />

        {/* Register Your Shop Banner */}
        <section>
          <div 
            onClick={() => window.open(import.meta.env.VITE_MERCHANT_URL || 'http://nearby-merchant-app-shameem.s3-website.ap-south-1.amazonaws.com', '_blank')}
            className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Store size={24} className="text-white" />
              </div>
              <div className="flex-1 text-white">
                <h3 className="font-bold text-lg mb-1">Register Your Shop</h3>
                <p className="text-white/90 text-sm">Join NearBy and reach customers nearby</p>
              </div>
              <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Categories</h2>
          <CategoryGrid categories={categories} isLoading={isLoadingCategories} />
        </section>

        {/* Nearby Shops Section */}
        <NearbyShops />

        {/* Merchant Broadcast Offers Section */}
        {merchantOffers.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Tag size={20} className="text-green-600" />
                <h2 className="text-xl font-bold text-gray-900">Live Offers from Merchants</h2>
              </div>
              <button 
                onClick={() => navigate('/offers')}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                View All
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {merchantOffers.slice(0, 3).map((offer) => (
                <OfferCard
                  key={offer.offerId}
                  offer={offer}
                  userLocation={lat && lng ? { lat, lng } : undefined}
                />
              ))}
            </div>
          </section>
        )}

        {/* Nearby Offers Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Nearby Offers</h2>
            <button 
              onClick={() => navigate('/offers')}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              View All
            </button>
          </div>
          {/* @ts-ignore - Type mismatch between Offer types */}
          <NearbyOffers offers={offers} isLoading={isLoadingOffers} />
        </section>
      </main>
    </div>
  );
};

export default Home;
