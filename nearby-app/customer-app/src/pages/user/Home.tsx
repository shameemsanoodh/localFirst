import React from 'react';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { EnhancedHeroSection } from '@/components/home/EnhancedHeroSection';
import { NearbyOffers } from '@/components/home/NearbyOffers';
import { NearbyShops } from '@/components/shops/NearbyShops';
import { useLocationStore } from '@/store/locationStore';
import { useOffers } from '@/hooks/useOffers';
import { useCategories } from '@/hooks/useCategories';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { lat, lng } = useLocationStore();
  
  // Fetch real data using hooks
  const { offers, isLoading: isLoadingOffers } = useOffers({
    lat: lat,
    lng: lng,
    radius: 5,
  });

  const { categories, isLoading: isLoadingCategories } = useCategories();

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* No header - location is now in hero section */}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-5 space-y-6">
        {/* Enhanced Hero Section with Inline Search */}
        <EnhancedHeroSection />

        {/* Categories Section */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Categories</h2>
          <CategoryGrid categories={categories} isLoading={isLoadingCategories} />
        </section>

        {/* Nearby Shops Section */}
        <NearbyShops />

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
