import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';

import { HttpService } from '../../../core/services/http.service';
import { ConfigService } from '../../../core/services/config.service';
import { ApiResponse } from '../../../core/models/api-response.model';
import { API_CONSTANTS } from '../../../core/constants/api.constants';
import {
    Supplier,
    SupplierFilters,
    SupplierListResponse,
    CreateSupplierDto,
    UpdateSupplierDto,
    ChangeStatusDto,
    EvaluateSupplierDto,
    SupplierPurchaseHistory,
    SupplierStatus
} from '../models/supplier.model';

/**
 * Servicio de Proveedores
 * Sprint 8 - Gestión de Proveedores
 */
@Injectable({
    providedIn: 'root'
})
export class SupplierService {

    constructor(
        private httpService: HttpService,
        private config: ConfigService,
        private httpClient: HttpClient
    ) { }

    getSuppliers(filters: SupplierFilters = {}): Observable<ApiResponse<SupplierListResponse>> {
        const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.SUPPLIERS);
        return this.httpService.get<SupplierListResponse>(url, filters);
    }

    getSupplierById(id: number): Observable<ApiResponse<Supplier>> {
        const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.SUPPLIERS_BY_ID(id));
        return this.httpService.get<Supplier>(url);
    }

    createSupplier(dto: CreateSupplierDto): Observable<ApiResponse<Supplier>> {
        const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.SUPPLIERS);
        return this.httpService.post<Supplier>(url, dto);
    }

    updateSupplier(id: number, dto: UpdateSupplierDto): Observable<ApiResponse<Supplier>> {
        const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.SUPPLIERS_BY_ID(id));
        return this.httpService.put<Supplier>(url, dto);
    }

    deleteSupplier(id: number): Observable<ApiResponse<{ message: string }>> {
        const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.SUPPLIERS_BY_ID(id));
        return this.httpService.delete<{ message: string }>(url);
    }

    /**
     * PATCH /:id/status — requiere body { status: 'active'|'inactive'|'suspended', reason? }
     */
    changeStatus(id: number, dto: ChangeStatusDto): Observable<ApiResponse<{ message: string; supplier: Supplier }>> {
        const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.SUPPLIERS_STATUS(id));
        return this.httpClient
            .patch<ApiResponse<{ message: string; supplier: Supplier }>>(url, dto)
            .pipe(timeout(API_CONSTANTS.TIMEOUT));
    }

    /** POST /:id/evaluate */
    evaluateSupplier(
        id: number,
        dto: EvaluateSupplierDto
    ): Observable<ApiResponse<{ message: string; supplier: Supplier }>> {
        const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.SUPPLIERS_EVALUATE(id));
        return this.httpService.post<{ message: string; supplier: Supplier }>(url, dto);
    }

    getPurchaseHistory(
        id: number,
        params: { page?: number; limit?: number; startDate?: string; endDate?: string } = {}
    ): Observable<ApiResponse<SupplierPurchaseHistory>> {
        const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.SUPPLIERS_PURCHASES(id));
        return this.httpService.get<SupplierPurchaseHistory>(url, params);
    }
}
