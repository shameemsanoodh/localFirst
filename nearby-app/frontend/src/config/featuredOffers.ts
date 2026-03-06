/**
 * Featured Offers Configuration
 * 
 * This file manages the featured offer banners displayed on the Offers page.
 * Each offer can be toggled on/off and has an expiry date.
 */

export interface FeaturedOffer {
  id: string;
  title: string;
  description: string;
  promoCode: string;
  discount: number;
  validUntil: string; // ISO date string
  isActive: boolean;
  priority: number; // Higher priority shows first
}

/**
 * Featured offers configuration
 * Add new offers here and toggle isActive to show/hide them
 */
export const featuredOffers: FeaturedOffer[] = [
  {
    id: 'first-order-bonus',
    title: 'First Order Bonus!',
    description: 'Get ₹50 off on your first purchase from any shop',
    promoCode: 'NEARBY50',
    discount: 50,
    validUntil: '2026-12-31T23:59:59Z',
    isActive: true,
    priority: 1,
  },
  // Add more featured offers here
  // {
  //   id: 'weekend-special',
  //   title: 'Weekend Special!',
  //   description: 'Extra 20% off on all electronics',
  //   promoCode: 'WEEKEND20',
  //   discount: 20,
  //   validUntil: '2024-12-15T23:59:59Z',
  //   isActive: false,
  //   priority: 2,
  // },
];

/**
 * Get active featured offers that haven't expired
 * Returns offers sorted by priority (highest first)
 */
export const getActiveFeaturedOffers = (): FeaturedOffer[] => {
  const now = new Date();
  
  return featuredOffers
    .filter(offer => {
      // Check if offer is active
      if (!offer.isActive) return false;
      
      // Check if offer hasn't expired
      const expiryDate = new Date(offer.validUntil);
      if (expiryDate < now) return false;
      
      return true;
    })
    .sort((a, b) => b.priority - a.priority); // Sort by priority descending
};

/**
 * Get a specific featured offer by ID
 */
export const getFeaturedOfferById = (id: string): FeaturedOffer | undefined => {
  return featuredOffers.find(offer => offer.id === id);
};

/**
 * Check if an offer is expired
 */
export const isOfferExpired = (offer: FeaturedOffer): boolean => {
  const now = new Date();
  const expiryDate = new Date(offer.validUntil);
  return expiryDate < now;
};

/**
 * Format the validity date for display
 * Example: "Dec 31" or "Jan 15, 2025"
 */
export const formatValidityDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  const now = new Date();
  
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
  };
  
  // Add year if it's not the current year
  if (date.getFullYear() !== now.getFullYear()) {
    options.year = 'numeric';
  }
  
  return date.toLocaleDateString('en-US', options);
};
