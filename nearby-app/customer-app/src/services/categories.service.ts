import api from './api';
import type { Category } from '@/types/category.types';

interface CategoriesApiResponse {
  success: boolean;
  data: {
    categories: Category[];
  };
}

interface CategoryApiResponse {
  success: boolean;
  data: {
    category: Category;
  };
}

export const categoriesService = {
  /**
   * List all categories from the backend (public endpoint — no auth needed)
   */
  async getAll(parentId?: string, level?: number): Promise<Category[]> {
    const params = new URLSearchParams();
    if (parentId) params.append('parentId', parentId);
    if (level !== undefined) params.append('level', level.toString());

    const response = await api.get<CategoriesApiResponse>(`/categories?${params}`);
    return response.data.data.categories;
  },

  /**
   * Get a single category by ID
   */
  async getById(categoryId: string): Promise<Category> {
    const response = await api.get<CategoryApiResponse>(`/categories/${categoryId}`);
    return response.data.data.category;
  },

  /**
   * Admin: Create a new category
   */
  async create(data: Partial<Category>): Promise<Category> {
    const response = await api.post<CategoryApiResponse>('/admin/categories', data);
    return response.data.data.category;
  },

  /**
   * Admin: Update a category
   */
  async update(categoryId: string, data: Partial<Category>): Promise<Category> {
    const response = await api.put<CategoryApiResponse>(`/admin/categories/${categoryId}`, data);
    return response.data.data.category;
  },

  /**
   * Admin: Delete a category
   */
  async delete(categoryId: string): Promise<void> {
    await api.delete(`/admin/categories/${categoryId}`);
  },
};
