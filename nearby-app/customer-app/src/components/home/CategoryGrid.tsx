import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '../ui/Skeleton';
import type { Category } from '@/types/category.types';

interface CategoryGridProps {
  categories?: Category[];
  isLoading?: boolean;
}

// Map category IDs to generated icon images
const categoryIconMap: Record<string, string> = {
  groceries: '/icons/groceries.png',
  hardware: '/icons/hardware.png',
  pharmacy: '/icons/pharmacy.png',
  automobile: '/icons/automobile.png',
  electronics: '/icons/electronics.png',
  mobile: '/icons/mobile.png',
  home: '/icons/home-essentials.png',
  pets: '/icons/pet-supplies.png',
};

// Default categories if none are loaded
const defaultCategories: Category[] = [
  { categoryId: 'groceries', name: 'Groceries', icon: '', parentId: null, level: 0, depth: 0, order: 1 },
  { categoryId: 'hardware', name: 'Hardware', icon: '', parentId: null, level: 0, depth: 0, order: 2 },
  { categoryId: 'pharmacy', name: 'Pharmacy', icon: '', parentId: null, level: 0, depth: 0, order: 3 },
  { categoryId: 'automobile', name: 'Automobile', icon: '', parentId: null, level: 0, depth: 0, order: 4 },
  { categoryId: 'electronics', name: 'Electronics', icon: '', parentId: null, level: 0, depth: 0, order: 5 },
  { categoryId: 'mobile', name: 'Mobile', icon: '', parentId: null, level: 0, depth: 0, order: 6 },
  { categoryId: 'home', name: 'Home Essentials', icon: '', parentId: null, level: 0, depth: 0, order: 7 },
  { categoryId: 'pets', name: 'Pet Supplies', icon: '', parentId: null, level: 0, depth: 0, order: 8 },
];

export const CategoryGrid: React.FC<CategoryGridProps> = ({ categories = [], isLoading = false }) => {
  const navigate = useNavigate();

  const displayCategories = categories.length > 0 ? categories : defaultCategories;

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex flex-col items-center gap-3">
            <Skeleton className="w-20 h-20 md:w-24 md:h-24 rounded-full" />
            <Skeleton className="h-3 w-14" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Mobile: show 4 visible + swipe for rest */}
      <div className="md:hidden flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory">
        {displayCategories.map((category) => {
          const iconSrc = categoryIconMap[category.categoryId] || '/icons/groceries.png';

          return (
            <button
              key={category.categoryId}
              onClick={() => navigate(`/categories?filter=${category.categoryId}`)}
              className="flex flex-col items-center gap-2.5 snap-start group"
              style={{ minWidth: 'calc((100% - 48px) / 4)' }}
            >
              <div className="w-[76px] h-[76px] rounded-full overflow-hidden bg-gradient-to-br from-gray-50 to-white shadow-card ring-2 ring-white group-hover:shadow-card-hover group-active:scale-95 transition-all duration-200">
                <img
                  src={iconSrc}
                  alt={category.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <span className="text-xs font-semibold text-gray-700 text-center leading-tight w-[76px] truncate">
                {category.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Desktop: grid — 4 per row */}
      <div className="hidden md:grid grid-cols-4 lg:grid-cols-8 gap-6">
        {displayCategories.map((category) => {
          const iconSrc = categoryIconMap[category.categoryId] || '/icons/groceries.png';

          return (
            <button
              key={category.categoryId}
              onClick={() => navigate(`/categories?filter=${category.categoryId}`)}
              className="flex flex-col items-center gap-3 group p-3 rounded-2xl hover:bg-gray-50 transition-all duration-200"
            >
              <div className="w-24 h-24 rounded-full overflow-hidden bg-white shadow-card group-hover:shadow-card-hover group-hover:scale-105 transition-all duration-300 ring-2 ring-white">
                <img
                  src={iconSrc}
                  alt={category.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <span className="text-sm font-semibold text-gray-700 text-center leading-tight group-hover:text-nearby-600 transition-colors">
                {category.name}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
};
