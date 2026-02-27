import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';

import { HttpService } from '../../../core/services/http.service';
import { ConfigService } from '../../../core/services/config.service';
import { ApiResponse } from '../../../core/models/api-response.model';
import { API_CONSTANTS } from '../../../core/constants/api.constants';
import {
  Product,
  ProductFilters,
  ProductListResponse,
  CreateProductDto,
  UpdateProductDto,
  UpdatePriceDto
} from '../models/product.model';

/**
 * Servicio de Productos
 * Sprint 6 - Gestión de Productos
 */
@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor(
    private httpService: HttpService,
    private config: ConfigService,
    private httpClient: HttpClient
  ) {}

  getProducts(filters: ProductFilters = {}): Observable<ApiResponse<ProductListResponse>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.PRODUCTS);
    return this.httpService.get<ProductListResponse>(url, filters);
  }

  getProductById(id: number): Observable<ApiResponse<Product>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.PRODUCTS_BY_ID(id));
    return this.httpService.get<Product>(url);
  }

  findByBarcode(code: string): Observable<ApiResponse<Product>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.PRODUCTS_BARCODE(code));
    return this.httpService.get<Product>(url);
  }

  createProduct(dto: CreateProductDto): Observable<ApiResponse<Product>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.PRODUCTS);
    return this.httpService.post<Product>(url, dto);
  }

  updateProduct(id: number, dto: UpdateProductDto): Observable<ApiResponse<Product>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.PRODUCTS_BY_ID(id));
    return this.httpService.put<Product>(url, dto);
  }

  updatePrice(id: number, dto: UpdatePriceDto): Observable<ApiResponse<any>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.PRODUCTS_PRICE(id));
    return this.httpClient
      .patch<ApiResponse<any>>(url, dto)
      .pipe(timeout(API_CONSTANTS.TIMEOUT));
  }

  uploadImage(id: number, file: File): Observable<ApiResponse<{ message: string; imageUrl: string }>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.PRODUCTS_IMAGE(id));
    const formData = new FormData();
    formData.append('image', file);
    return this.httpClient
      .post<ApiResponse<{ message: string; imageUrl: string }>>(url, formData)
      .pipe(timeout(60000)); // 60s para uploads
  }

  toggleStatus(id: number): Observable<ApiResponse<{ message: string; product: { id: number; isActive: boolean } }>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.PRODUCTS_STATUS(id));
    return this.httpClient
      .patch<ApiResponse<{ message: string; product: { id: number; isActive: boolean } }>>(url, {})
      .pipe(timeout(API_CONSTANTS.TIMEOUT));
  }

  deleteProduct(id: number): Observable<ApiResponse<{ message: string }>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.PRODUCTS_BY_ID(id));
    return this.httpService.delete<{ message: string }>(url);
  }
}
