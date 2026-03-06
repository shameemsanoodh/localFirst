import { Percent, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FeaturedOffer } from '@/config/featuredOffers';
import { formatValidityDate, isOfferExpired } from '@/config/featuredOffers';

interface FeaturedOfferBannerProps {
  offer?: FeaturedOffer;
  // Legacy props for backward compatibility
  title?: string;
  description?: string;
  promoCode?: string;
  validUntil?: string;
  discount?: number;
}

export const FeaturedOfferBanner: React.FC<FeaturedOfferBannerProps> = ({
  offer,
  title: legacyTitle,
  description: legacyDescription,
  promoCode: legacyPromoCode,
  validUntil: legacyValidUntil,
  discount: legacyDiscount,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Use offer data if provided, otherwise fall back to legacy props
  const title = offer?.title ?? legacyTitle ?? 'First Order Bonus!';
  const description = offer?.description ?? legacyDescription ?? 'Get ₹50 off on your first purchase from any shop';
  const promoCode = offer?.promoCode ?? legacyPromoCode ?? 'NEARBY50';
  const validUntil = offer ? formatValidityDate(offer.validUntil) : legacyValidUntil ?? 'Dec 31';
  const discount = offer?.discount ?? legacyDiscount ?? 50;

  // Check if offer is expired (only if offer object is provided)
  const expired = offer ? isOfferExpired(offer) : false;

  // Don't render if offer is expired or inactive
  if (offer && (!offer.isActive || expired)) {
    return null;
  }

  // Animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl shadow-lg
        bg-gradient-to-r from-blue-500 via-blue-600 to-purple-700
        transition-all duration-500 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
      `}
    >
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />

      <div className="relative p-5 md:p-6 lg:p-8">
        <div className="flex items-start justify-between gap-4">
          {/* Content */}
          <div className="flex-1 space-y-3 md:space-y-4">
            {/* Title */}
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white">
                {title}
              </h2>
            </div>

            {/* Description */}
            <p className="text-sm md:text-base text-white/90 max-w-2xl">
              {description}
            </p>

            {/* Promo Code and Validity */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              {/* Promo Code */}
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/30">
                <span className="text-xs md:text-sm text-white/80 font-medium">
                  Code:
                </span>
                <span className="text-base md:text-lg font-bold text-white tracking-wider">
                  {promoCode}
                </span>
              </div>

              {/* Validity */}
              <div className="inline-flex items-center gap-1.5 text-white/90">
                <Clock size={16} className="flex-shrink-0" />
                <span className="text-xs md:text-sm font-medium">
                  Valid till {validUntil}
                </span>
              </div>
            </div>
          </div>

          {/* Percentage Icon */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center">
              <Percent size={32} className="text-white md:w-10 md:h-10 lg:w-12 lg:h-12" />
            </div>
          </div>
        </div>
      </div>

      {/* Animated shine effect */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-shine"
        style={{
          animation: 'shine 3s ease-in-out infinite',
        }}
      />
    </div>
  );
};
