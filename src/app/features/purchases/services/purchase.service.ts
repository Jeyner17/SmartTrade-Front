import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';

import { HttpService } from '../../../core/services/http.service';
import { ConfigService } from '../../../core/services/config.service';
import { ApiResponse } from '../../../core/models/api-response.model';
import { API_CONSTANTS } from '../../../core/constants/api.constants';
import {
  PurchaseOrder,
  PurchaseListResponse,
  PurchaseFilters,
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  ChangePurchaseStatusDto,
  ReceivePurchaseOrderDto,
  CancelPurchaseOrderDto
} from '../models/purchase.model';

@Injectable({
  providedIn: 'root'
})
export class PurchaseService {

  constructor(
    private httpService: HttpService,
    private config: ConfigService,
    private httpClient: HttpClient
  ) {}

  getOrders(filters: PurchaseFilters = {}): Observable<ApiResponse<PurchaseListResponse>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.PURCHASES);
    return this.httpService.get<PurchaseListResponse>(url, filters);
  }

  getOrderById(id: number): Observable<ApiResponse<PurchaseOrder>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.PURCHASES_BY_ID(id));
    return this.httpService.get<PurchaseOrder>(url);
  }

  createOrder(dto: CreatePurchaseOrderDto): Observable<ApiResponse<PurchaseOrder>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.PURCHASES);
    return this.httpService.post<PurchaseOrder>(url, dto);
  }

  updateOrder(id: number, dto: UpdatePurchaseOrderDto): Observable<ApiResponse<PurchaseOrder>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.PURCHASES_BY_ID(id));
    return this.httpService.put<PurchaseOrder>(url, dto);
  }

  changeStatus(id: number, dto: ChangePurchaseStatusDto): Observable<ApiResponse<any>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.PURCHASES_STATUS(id));
    return this.httpClient.patch<ApiResponse<any>>(url, dto).pipe(timeout(API_CONSTANTS.TIMEOUT));
  }

  receiveOrder(id: number, dto: ReceivePurchaseOrderDto): Observable<ApiResponse<any>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.PURCHASES_RECEIVE(id));
    return this.httpService.post<any>(url, dto);
  }

  cancelOrder(id: number, dto: CancelPurchaseOrderDto): Observable<ApiResponse<any>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.PURCHASES_CANCEL(id));
    return this.httpService.post<any>(url, dto);
  }

  getSupplierOrders(
    supplierId: number,
    params: { page?: number; limit?: number; startDate?: string; endDate?: string } = {}
  ): Observable<ApiResponse<any>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.PURCHASES_BY_SUPPLIER(supplierId));
    return this.httpService.get<any>(url, params);
  }

  getReport(params: {
    startDate?: string;
    endDate?: string;
    supplierId?: number;
    status?: string;
  } = {}): Observable<ApiResponse<any>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.PURCHASES_REPORT);
    return this.httpService.get<any>(url, params);
  }
}
