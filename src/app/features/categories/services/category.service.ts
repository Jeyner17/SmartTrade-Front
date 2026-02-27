import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';

import { HttpService } from '../../../core/services/http.service';
import { ConfigService } from '../../../core/services/config.service';
import { ApiResponse } from '../../../core/models/api-response.model';
import { API_CONSTANTS } from '../../../core/constants/api.constants';
import {
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryProductsResponse
} from '../models/category.model';

/**
 * Servicio de Categorías
 * Sprint 5 - Gestión de Categorías
 */
@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  constructor(
    private httpService: HttpService,
    private config: ConfigService,
    private httpClient: HttpClient
  ) {}

  /** Obtener árbol de categorías */
  getCategories(status: 'active' | 'inactive' | 'all' = 'all'): Observable<ApiResponse<Category[]>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.CATEGORIES);
    return this.httpService.get<Category[]>(url, { status });
  }

  /** Obtener categoría por ID */
  getCategoryById(id: number): Observable<ApiResponse<Category>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.CATEGORIES_BY_ID(id));
    return this.httpService.get<Category>(url);
  }

  /** Crear nueva categoría */
  createCategory(dto: CreateCategoryDto): Observable<ApiResponse<Category>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.CATEGORIES);
    return this.httpService.post<Category>(url, dto);
  }

  /** Actualizar categoría */
  updateCategory(id: number, dto: UpdateCategoryDto): Observable<ApiResponse<Category>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.CATEGORIES_BY_ID(id));
    return this.httpService.put<Category>(url, dto);
  }

  /** Activar/Desactivar categoría (PATCH) */
  toggleStatus(id: number): Observable<ApiResponse<{ message: string; category: { id: number; isActive: boolean } }>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.CATEGORIES_STATUS(id));
    return this.httpClient
      .patch<ApiResponse<{ message: string; category: { id: number; isActive: boolean } }>>(url, {})
      .pipe(timeout(API_CONSTANTS.TIMEOUT));
  }

  /** Eliminar categoría */
  deleteCategory(id: number): Observable<ApiResponse<{ message: string }>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.CATEGORIES_BY_ID(id));
    return this.httpService.delete<{ message: string }>(url);
  }

  /** Productos de la categoría */
  getCategoryProducts(id: number): Observable<ApiResponse<CategoryProductsResponse>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.CATEGORIES_PRODUCTS(id));
    return this.httpService.get<CategoryProductsResponse>(url);
  }
}
