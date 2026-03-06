import React from 'react';

export const ShopCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden animate-pulse">
      {/* Cover Image Skeleton */}
      <div className="h-40 bg-gray-200" />

      {/* Shop Info Skeleton */}
      <div className="p-4 space-y-3">
        {/* Logo and Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-gray-200 rounded w-3/4" />
          </div>
        </div>

        {/* Rating */}
        <div className="h-4 bg-gray-200 rounded w-1/2" />

        {/* Location */}
        <div className="h-4 bg-gray-200 rounded w-2/3" />

        {/* Time */}
        <div className="h-4 bg-gray-200 rounded w-1/2" />

        {/* Tags */}
        <div className="flex gap-2 pt-2">
          <div className="h-6 bg-gray-200 rounded-full w-16" />
          <div className="h-6 bg-gray-200 rounded-full w-20" />
          <div className="h-6 bg-gray-200 rounded-full w-14" />
        </div>
      </div>
    </div>
  );
};
