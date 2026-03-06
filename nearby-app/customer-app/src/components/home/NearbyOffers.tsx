import { Clock, MapPin, Heart } from 'lucide-react';
import { OfferCardSkeleton } from './OfferCardSkeleton';

interface Offer {
  id: string;
  title: string;
  merchant: {
    name: string;
  };
  distance: string;
  validUntil: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
}

interface NearbyOffersProps {
  offers: Offer[];
  isLoading: boolean;
}

const getTimeLeft = (isoString: string) => {
  const now = new Date();
  const expiry = new Date(isoString);
  const diffMs = expiry.getTime() - now.getTime();
  if (diffMs <= 0) return 'Expired';
  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffHours < 1) {
    const diffMinutes = Math.round(diffHours * 60);
    return `${diffMinutes}m left`;
  }
  return `${Math.round(diffHours)}h left`;
};

const getDiscountPercent = (price: number, originalPrice?: number) => {
  if (!originalPrice || originalPrice <= price) return null;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
};

export const NearbyOffers: React.FC<NearbyOffersProps> = ({ offers, isLoading }) => {
  // Show empty state if no offers and not loading
  if (!isLoading && offers.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center shadow-card">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-10 h-10 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No offers available right now
        </h3>
        <p className="text-sm text-gray-500">
          Check back later for exclusive deals from nearby shops
        </p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide md:grid md:grid-cols-3 lg:grid-cols-4 md:overflow-x-visible md:mx-0 md:px-0 md:gap-5">
      {isLoading && (
        <>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-[260px] md:w-full flex-shrink-0">
              <OfferCardSkeleton />
            </div>
          ))}
        </>
      )}
      {!isLoading && offers.map((offer) => {
        const discount = getDiscountPercent(offer.price, offer.originalPrice);

        return (
          <div key={offer.id} className="flex-shrink-0 w-[260px] md:w-auto group cursor-pointer">
            <div className="bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 group-hover:-translate-y-1">
              {/* Image */}
              <div className="relative h-[160px] md:h-[180px] overflow-hidden bg-gray-100">
                <img
                  src={offer.imageUrl || 'https://placehold.co/400x300/f8fafc/94a3b8?text=No+Image'}
                  alt={offer.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                {/* Gradient overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />

                {/* Discount badge */}
                {discount && (
                  <div className="absolute bottom-3 left-3 discount-badge">
                    {discount}% OFF
                  </div>
                )}

                {/* Like button */}
                <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm">
                  <Heart size={16} className="text-gray-500 hover:text-red-500 transition-colors" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 text-sm truncate mb-1">
                  {offer.title}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                  <span>{offer.merchant.name}</span>
                  <span className="text-gray-300">•</span>
                  <div className="flex items-center gap-0.5">
                    <MapPin size={11} />
                    <span>{offer.distance} km</span>
                  </div>
                </div>

                {/* Price + Time */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900">₹{offer.price}</span>
                    {offer.originalPrice && (
                      <span className="text-xs text-gray-400 line-through">
                        ₹{offer.originalPrice}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-nearby-500">
                    <Clock size={12} />
                    <span className="text-xs font-medium">
                      {getTimeLeft(offer.validUntil)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
