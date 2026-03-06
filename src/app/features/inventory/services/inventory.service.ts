import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';

import { HttpService } from '../../../core/services/http.service';
import { ConfigService } from '../../../core/services/config.service';
import { ApiResponse } from '../../../core/models/api-response.model';
import { API_CONSTANTS } from '../../../core/constants/api.constants';
import {
  InventoryFilters,
  InventoryListResponse,
  ProductStock,
  MovementFilters,
  MovementHistoryResponse,
  RegisterMovementDto,
  RegisterMovementResponse,
  AdjustInventoryDto,
  AdjustInventoryResponse,
  UpdateStockLimitsDto,
  UpdateStockLimitsResponse,
  LowStockAlertsResponse,
  InventoryValue
} from '../models/inventory.model';

/**
 * Servicio de Inventario
 * Sprint 7 - Gestión de Inventario
 */
@Injectable({
  providedIn: 'root'
})
export class InventoryService {

  constructor(
    private httpService: HttpService,
    private config: ConfigService,
    private httpClient: HttpClient
  ) {}

  /**
   * 1. Obtener lista de inventario con filtros
   * GET /api/v1/inventory
   */
  getInventory(filters: InventoryFilters = {}): Observable<ApiResponse<InventoryListResponse>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.INVENTORY);
    return this.httpService.get<InventoryListResponse>(url, filters);
  }

  /**
   * 2. Obtener stock de un producto específico
   * GET /api/v1/inventory/:id
   */
  getProductStock(productId: number): Observable<ApiResponse<ProductStock>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.INVENTORY_BY_ID(productId));
    return this.httpService.get<ProductStock>(url);
  }

  /**
   * 3. Registrar movimiento de inventario (entrada/salida manual)
   * POST /api/v1/inventory/movement
   */
  registerMovement(dto: RegisterMovementDto): Observable<ApiResponse<RegisterMovementResponse>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.INVENTORY_MOVEMENT);
    return this.httpService.post<RegisterMovementResponse>(url, dto);
  }

  /**
   * 4. Obtener historial de movimientos de un producto
   * GET /api/v1/inventory/:id/movements
   */
  getMovementHistory(productId: number, filters: MovementFilters = {}): Observable<ApiResponse<MovementHistoryResponse>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.INVENTORY_MOVEMENTS(productId));
    return this.httpService.get<MovementHistoryResponse>(url, filters);
  }

  /**
   * 5. Actualizar límites de stock (mínimo/máximo) y ubicación
   * PUT /api/v1/inventory/:id/limits
   */
  updateStockLimits(productId: number, dto: UpdateStockLimitsDto): Observable<ApiResponse<UpdateStockLimitsResponse>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.INVENTORY_LIMITS(productId));
    return this.httpClient
      .put<ApiResponse<UpdateStockLimitsResponse>>(url, dto)
      .pipe(timeout(API_CONSTANTS.TIMEOUT));
  }

  /**
   * 6. Obtener productos con stock bajo
   * GET /api/v1/inventory/alerts
   */
  getLowStockAlerts(): Observable<ApiResponse<LowStockAlertsResponse>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.INVENTORY_ALERTS);
    return this.httpService.get<LowStockAlertsResponse>(url);
  }

  /**
   * 7. Ajustar inventario (inventario físico)
   * POST /api/v1/inventory/adjust
   */
  adjustInventory(dto: AdjustInventoryDto): Observable<ApiResponse<AdjustInventoryResponse>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.INVENTORY_ADJUST);
    return this.httpService.post<AdjustInventoryResponse>(url, dto);
  }

  /**
   * 8. Obtener valor total del inventario
   * GET /api/v1/inventory/value
   */
  getInventoryValue(categoryId?: number): Observable<ApiResponse<InventoryValue>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.INVENTORY_VALUE);
    const params = categoryId ? { categoryId } : {};
    return this.httpService.get<InventoryValue>(url, params);
  }

  /**
   * Helper: Determinar clase CSS según nivel de stock
   */
  getStockStatusClass(stock: number, minStock: number, maxStock?: number): string {
    if (stock === 0) {
      return 'text-danger'; // Rojo - Sin stock
    } else if (stock <= minStock) {
      return 'text-warning'; // Amarillo - Stock bajo
    } else if (maxStock && stock > maxStock) {
      return 'text-info'; // Azul - Exceso de stock
    } else {
      return 'text-success'; // Verde - Stock normal
    }
  }

  /**
   * Helper: Obtener badge según nivel de stock
   */
  getStockStatusBadge(stock: number, minStock: number, maxStock?: number): string {
    if (stock === 0) {
      return 'bg-danger';
    } else if (stock <= minStock) {
      return 'bg-warning';
    } else if (maxStock && stock > maxStock) {
      return 'bg-info';
    } else {
      return 'bg-success';
    }
  }

  /**
   * Helper: Obtener etiqueta de estado de stock
   */
  getStockStatusLabel(stock: number, minStock: number, maxStock?: number): string {
    if (stock === 0) {
      return 'Sin Stock';
    } else if (stock <= minStock) {
      return 'Stock Bajo';
    } else if (maxStock && stock > maxStock) {
      return 'Exceso';
    } else {
      return 'Normal';
    }
  }
}
