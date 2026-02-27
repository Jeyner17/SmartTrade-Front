/**
 * Modelos de Productos
 * Sprint 6 - Gestión de Productos
 */

export interface PriceHistory {
  id: number;
  productId: number;
  previousPrice: number;
  newPrice: number;
  reason?: string;
  changedBy?: number;
  changedByUser?: { id: number; username: string };
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  price: number;
  cost?: number;
  taxPercent: number;
  imageUrl?: string;
  stock: number;
  categoryId?: number;
  category?: { id: number; name: string; level?: number };
  isActive: boolean;
  priceHistory?: PriceHistory[];
  createdBy?: number;
  updatedBy?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  price: number;
  cost?: number;
  taxPercent?: number;
  categoryId?: number | null;
  isActive?: boolean;
}

export type UpdateProductDto = Partial<CreateProductDto>;

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: number;
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export interface ProductListResponse {
  products: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface UpdatePriceDto {
  newPrice: number;
  reason?: string;
}
