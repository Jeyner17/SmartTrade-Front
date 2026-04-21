import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpService } from '../../../core/services/http.service';
import { ConfigService } from '../../../core/services/config.service';
import { ApiResponse } from '../../../core/models/api-response.model';
import { API_CONSTANTS } from '../../../core/constants/api.constants';
import {
  PosCart,
  PosCustomer,
  PosSale,
  PosTodaySaleSummary,
  PopularProductItem,
  AddCartItemDto,
  ApplyDiscountDto,
  ProcessPaymentDto,
  QuickCustomerDto
} from '../models/pos.model';

@Injectable({ providedIn: 'root' })
export class PosService {
  constructor(
    private httpService: HttpService,
    private config: ConfigService
  ) {}

  addToCart(dto: AddCartItemDto): Observable<ApiResponse<PosCart>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.POS_CART_ITEMS);
    return this.httpService.post<PosCart>(url, dto);
  }

  removeFromCart(sessionId: number, productId: number): Observable<ApiResponse<PosCart>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.POS_CART_ITEM(sessionId, productId));
    return this.httpService.delete<PosCart>(url);
  }

  updateCartQuantity(sessionId: number, productId: number, quantity: number): Observable<ApiResponse<PosCart>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.POS_CART_ITEM(sessionId, productId));
    return this.httpService.put<PosCart>(url, { quantity });
  }

  applyDiscount(sessionId: number, dto: ApplyDiscountDto): Observable<ApiResponse<PosCart>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.POS_CART_DISCOUNT(sessionId));
    return this.httpService.post<PosCart>(url, dto);
  }

  calculateTotal(sessionId: number): Observable<ApiResponse<PosCart>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.POS_CART_TOTAL(sessionId));
    return this.httpService.get<PosCart>(url);
  }

  processPayment(sessionId: number, dto: ProcessPaymentDto): Observable<ApiResponse<PosSale>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.POS_CART_PAYMENT(sessionId));
    return this.httpService.post<PosSale>(url, dto);
  }

  searchCustomer(term: string): Observable<ApiResponse<PosCustomer[]>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.POS_CUSTOMERS_SEARCH);
    return this.httpService.get<PosCustomer[]>(url, { term });
  }

  quickCreateCustomer(dto: QuickCustomerDto): Observable<ApiResponse<PosCustomer>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.POS_CUSTOMERS_QUICK);
    return this.httpService.post<PosCustomer>(url, dto);
  }

  listTodaySales(filters: { cashierId?: number; startHour?: string; endHour?: string } = {}): Observable<ApiResponse<PosTodaySaleSummary[]>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.POS_SALES_TODAY);
    return this.httpService.get<PosTodaySaleSummary[]>(url, filters);
  }

  getSaleById(id: number): Observable<ApiResponse<PosSale>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.POS_SALE_BY_ID(id));
    return this.httpService.get<PosSale>(url);
  }

  voidSale(id: number, reason: string): Observable<ApiResponse<any>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.POS_SALE_VOID(id));
    return this.httpService.post<any>(url, { reason });
  }

  getPopularProducts(filters: { limit?: number; period?: 'day' | 'week' | 'month' | 'range'; startDate?: string; endDate?: string } = {}): Observable<ApiResponse<PopularProductItem[]>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.POS_PRODUCTS_POPULAR);
    return this.httpService.get<PopularProductItem[]>(url, filters);
  }
}
