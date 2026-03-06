import { useQuery } from '@tanstack/react-query';
import { categoriesService } from '@/services/categories.service';

export const useCategories = (parentId?: string, level?: number) => {
  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['categories', parentId, level],
    queryFn: () => categoriesService.getAll(parentId, level),
  });

  return {
    categories: categories || [],
    isLoading,
    error,
  };
};

export const useCategory = (categoryId: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['category', categoryId],
    queryFn: () => categoriesService.getById(categoryId),
    enabled: !!categoryId,
  });

  return {
    category: data,
    breadcrumb: [],
    isLoading,
    error,
  };
};
