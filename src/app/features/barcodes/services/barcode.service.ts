import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { timeout } from 'rxjs/operators';

import { HttpService } from '../../../core/services/http.service';
import { ConfigService } from '../../../core/services/config.service';
import { ApiResponse } from '../../../core/models/api-response.model';
import { API_CONSTANTS } from '../../../core/constants/api.constants';

import {
  ScanResult,
  GenerateQrDto,
  QrResult,
  ScannerConfig,
  ScannerConfigResponse
} from '../models/barcode.model';

/**
 * Servicio de Códigos de Barra / QR
 * Sprint 11 - SmartTrade
 *
 * Flujo de escaneo:
 *   - Buscar producto por código de barras → GET /products/barcode/:code
 *   - Aplicar ajuste de inventario         → POST /inventory/adjust
 *   - Generar QR                           → POST /barcodes/generate
 *   - Configuración del escáner            → GET/PUT /barcodes/config
 *   - Logs de escaneo                      → GET/POST /barcodes/logs
 */
@Injectable({ providedIn: 'root' })
export class BarcodeService {

  constructor(
    private httpService: HttpService,
    private config: ConfigService,
    private http: HttpClient
  ) {}

  // ─── Escaneo: busca el producto por su código de barras ───────────────────

  /**
   * GET /products/barcode/:code
   * Busca un producto por su código de barras.
   * Devuelve: nombre, precio, stock, imagen, categoría, unidad.
   * Usada en: Verificación de Precios, POS Scanner, Inventario.
   */
  scanBarcode(code: string): Observable<ApiResponse<ScanResult>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.PRODUCTS_BARCODE(code));
    return this.httpService.get<ScanResult>(url);
  }

  // ─── Generador de QR ─────────────────────────────────────────────────────

  /**
   * POST /barcodes/generate
   * Genera una imagen QR en base64 para el tipo y datos indicados.
   */
  generateQr(dto: GenerateQrDto): Observable<ApiResponse<QrResult>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.BARCODES_GENERATE_QR);
    return this.httpService.post<QrResult>(url, dto);
  }

  // ─── Historial de escaneos ────────────────────────────────────────────────

  /**
   * POST /barcodes/logs
   * Registra un escaneo en el historial del sistema.
   */
  registerScan(code: string, context?: string): Observable<ApiResponse<unknown>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.BARCODES_LOGS);
    return this.httpService.post<unknown>(url, { code, context });
  }

  /**
   * GET /barcodes/logs
   * Obtiene el historial de escaneos del sistema.
   */
  getScanHistory(params?: Record<string, string>): Observable<ApiResponse<unknown>> {
    let url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.BARCODES_LOGS);
    if (params) {
      url += `?${new URLSearchParams(params).toString()}`;
    }
    return this.httpService.get<unknown>(url);
  }

  // ─── Ajuste de inventario por conteo físico ───────────────────────────────

  /**
   * POST /inventory/adjust
   * Aplica los resultados del conteo físico al inventario del sistema.
   * Body: { items: [{ productId, countedQuantity, reason? }] }
   */
  applyInventoryAdjust(
    items: Array<{ productId: number; countedQuantity: number; reason?: string }>
  ): Observable<ApiResponse<unknown>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.INVENTORY_ADJUST);
    return this.httpService.post<unknown>(url, { items, reason: 'Conteo físico de inventario' });
  }

  // ─── Configuración del escáner ────────────────────────────────────────────

  /**
   * GET /barcodes/config
   * Carga la configuración actual del escáner desde el servidor.
   */
  getScannerConfig(): Observable<ApiResponse<ScannerConfigResponse>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.BARCODES_SCANNER_CONFIG);
    return this.httpService.get<ScannerConfigResponse>(url);
  }

  /**
   * PUT /barcodes/config
   * Guarda la nueva configuración del escáner en el servidor.
   */
  saveScannerConfig(config: ScannerConfig): Observable<ApiResponse<ScannerConfigResponse>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.BARCODES_SCANNER_CONFIG_SAVE);
    return this.http
      .put<ApiResponse<ScannerConfigResponse>>(url, config)
      .pipe(timeout(API_CONSTANTS.TIMEOUT));
  }
}
