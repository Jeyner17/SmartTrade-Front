/**
 * Modelos de Categorías
 * Sprint 5 - Gestión de Categorías
 */

export interface Category {
  id: number;
  name: string;
  description?: string;
  parentId: number | null;
  level: number;
  isActive: boolean;
  productCount: number;
  children: Category[];
  createdAt: string;
  updatedAt: string;
}

/** Categoría aplanada para renderizado del árbol en tabla */
export interface CategoryFlat {
  id: number;
  name: string;
  description?: string;
  parentId: number | null;
  level: number;
  isActive: boolean;
  productCount: number;
  hasChildren: boolean;
  isExpanded: boolean;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  parentId?: number | null;
  isActive?: boolean;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  parentId?: number | null;
  isActive?: boolean;
}

export interface CategoryProductsResponse {
  category: { id: number; name: string };
  products: any[];
  total: number;
}
