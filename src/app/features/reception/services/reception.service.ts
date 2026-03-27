import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpService } from '../../../core/services/http.service';
import { ConfigService } from '../../../core/services/config.service';
import { ApiResponse } from '../../../core/models/api-response.model';
import { API_CONSTANTS } from '../../../core/constants/api.constants';
import {
  Reception,
  ReceptionDiscrepancy,
  ReceptionFilters,
  ReceptionListResponse,
  CreateReceptionDto,
  VerifyBarcodeDto,
  RegisterScanDto,
  ConfirmReceptionDto,
  ReportDiscrepancyDto,
  ResolveDiscrepancyDto
} from '../models/reception.model';

@Injectable({
  providedIn: 'root'
})
export class ReceptionService {
  constructor(
    private httpService: HttpService,
    private config: ConfigService
  ) {}

  list(filters: ReceptionFilters = {}): Observable<ApiResponse<ReceptionListResponse>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.RECEPTIONS);
    return this.httpService.get<ReceptionListResponse>(url, filters);
  }

  getById(id: number): Observable<ApiResponse<Reception>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.RECEPTIONS_BY_ID(id));
    return this.httpService.get<Reception>(url);
  }

  create(dto: CreateReceptionDto): Observable<ApiResponse<Reception>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.RECEPTIONS);
    return this.httpService.post<Reception>(url, dto);
  }

  verifyBarcode(dto: VerifyBarcodeDto): Observable<ApiResponse<any>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.RECEPTIONS_VERIFY_BARCODE);
    return this.httpService.post<any>(url, dto);
  }

  registerScan(receptionId: number, dto: RegisterScanDto): Observable<ApiResponse<any>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.RECEPTIONS_SCAN(receptionId));
    return this.httpService.post<any>(url, dto);
  }

  confirm(receptionId: number, dto: ConfirmReceptionDto): Observable<ApiResponse<any>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.RECEPTIONS_CONFIRM(receptionId));
    return this.httpService.post<any>(url, dto);
  }

  reportDiscrepancy(receptionId: number, dto: ReportDiscrepancyDto): Observable<ApiResponse<ReceptionDiscrepancy>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.RECEPTIONS_DISCREPANCIES(receptionId));
    return this.httpService.post<ReceptionDiscrepancy>(url, dto);
  }

  listDiscrepancies(params: {
    page?: number;
    limit?: number;
    type?: string;
    resolved?: boolean;
    receptionId?: number;
  } = {}): Observable<ApiResponse<{ discrepancies: ReceptionDiscrepancy[]; pagination: any }>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.RECEPTIONS_DISCREPANCIES_LIST);
    return this.httpService.get<{ discrepancies: ReceptionDiscrepancy[]; pagination: any }>(url, params);
  }

  resolveDiscrepancy(discrepancyId: number, dto: ResolveDiscrepancyDto): Observable<ApiResponse<any>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.RECEPTIONS_DISCREPANCY_RESOLVE(discrepancyId));
    return this.httpService.post<any>(url, dto);
  }

  listConfirmedPurchaseOrders(params: { page?: number; limit?: number } = {}): Observable<ApiResponse<any>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.RECEPTIONS_CONFIRMED_ORDERS);
    return this.httpService.get<any>(url, params);
  }
}
