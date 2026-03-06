export interface Category {
  categoryId: string;
  name: string;
  parentId: string | null;
  icon: string;
  emoji?: string;
  color?: string;
  image?: string;
  level: number;
  depth: number;
  order: number;
  sortOrder?: number;
  isActive?: boolean;
  children?: Category[];
  createdAt?: string;
  updatedAt?: string;
}
