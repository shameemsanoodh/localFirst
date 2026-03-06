import React from 'react';
import { MapPin, Clock, Star, CheckCircle } from 'lucide-react';
import { Shop } from '@/services/shops.service';
import { motion } from 'framer-motion';

interface ShopCardProps {
  shop: Shop;
  onClick?: () => void;
}

export const ShopCard: React.FC<ShopCardProps> = ({ shop, onClick }) => {
  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      Groceries: 'bg-green-100 text-green-700',
      Pharmacy: 'bg-red-100 text-red-700',
      Electronics: 'bg-blue-100 text-blue-700',
      Books: 'bg-purple-100 text-purple-700',
      Clothing: 'bg-pink-100 text-pink-700',
      Fitness: 'bg-orange-100 text-orange-700',
      'Pet Store': 'bg-yellow-100 text-yellow-700',
      Cafe: 'bg-amber-100 text-amber-700',
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  const getOpenUntilText = (): string => {
    if (shop.isOpen) {
      const [hour, minute] = shop.closeTime.split(':');
      const closeHour = parseInt(hour);
      const period = closeHour >= 12 ? 'PM' : 'AM';
      const displayHour = closeHour > 12 ? closeHour - 12 : closeHour === 0 ? 12 : closeHour;
      return `Open until ${displayHour}:${minute} ${period}`;
    } else {
      const [hour, minute] = shop.openTime.split(':');
      const openHour = parseInt(hour);
      const period = openHour >= 12 ? 'PM' : 'AM';
      const displayHour = openHour > 12 ? openHour - 12 : openHour === 0 ? 12 : openHour;
      return `Opens at ${displayHour}:${minute} ${period}`;
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden cursor-pointer ${
        !shop.isOpen ? 'opacity-75' : ''
      }`}
    >
      {/* Cover Image */}
      <div className="relative h-40 overflow-hidden">
        {shop.coverImage ? (
          <img
            src={shop.coverImage}
            alt={shop.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-nearby-400 to-nearby-600 flex items-center justify-center">
            <span className="text-white text-4xl">🏪</span>
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        
        {/* Category Badge - Top Left */}
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(shop.category)}`}>
            {shop.category}
          </span>
        </div>
        
        {/* Open/Closed Badge - Top Right */}
        <div className="absolute top-3 right-3">
          {shop.isOpen ? (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500 text-white">
              Open
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500 text-white">
              Closed
            </span>
          )}
        </div>
      </div>

      {/* Shop Info */}
      <div className="p-4 space-y-2">
        {/* Shop Name with Logo */}
        <div className="flex items-center gap-3">
          {shop.logo && (
            <img
              src={shop.logo}
              alt={`${shop.name} logo`}
              className="w-10 h-10 rounded-full object-cover"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-gray-900 truncate">
                {shop.name}
              </h3>
              {shop.isVerified && (
                <CheckCircle size={16} className="text-blue-500 flex-shrink-0" />
              )}
            </div>
          </div>
        </div>

        {/* Rating or New Badge */}
        <div className="flex items-center gap-2">
          {shop.totalReviews > 0 ? (
            <>
              <div className="flex items-center gap-1">
                <Star size={16} className="text-yellow-500 fill-yellow-500" />
                <span className="font-semibold text-gray-900">{shop.rating}</span>
              </div>
              <span className="text-sm text-gray-500">
                ({shop.totalReviews} reviews)
              </span>
            </>
          ) : (
            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
              New
            </span>
          )}
        </div>

        {/* Location and Distance */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin size={14} className="flex-shrink-0" />
          <span className="truncate">{shop.location.area}</span>
          <span>•</span>
          <span className="font-medium">{shop.distanceKm} km</span>
        </div>

        {/* Open/Close Time */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock size={14} className="flex-shrink-0" />
          <span>{getOpenUntilText()}</span>
        </div>

        {/* Tags */}
        {shop.tags && shop.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {shop.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
