import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpService } from '../../../core/services/http.service';
import { ConfigService } from '../../../core/services/config.service';
import { ApiResponse } from '../../../core/models/api-response.model';
import { API_CONSTANTS, ConfigType } from '../../../core/constants/api.constants';
import {
  SystemConfiguration,
  ConfigurationResponse,
  BackupConfig,
  TechnicalParameters,
  LogoUploadResponse
} from '../models/settings.model';

/**
 * Servicio de Settings
 * Sprint 1 - Configuración del Sistema
 */
@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  constructor(
    private httpService: HttpService,
    private config: ConfigService
  ) { }

  /**
   * Obtener toda la configuración del sistema
   */
  getAllConfiguration(): Observable<ApiResponse<SystemConfiguration>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.SETTINGS);
    return this.httpService.get<SystemConfiguration>(url);
  }

  /**
   * Obtener configuración por tipo específico
   */
  getConfigurationByType(type: ConfigType): Observable<ApiResponse<ConfigurationResponse>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.SETTINGS_BY_TYPE(type));
    return this.httpService.get<ConfigurationResponse>(url);
  }

  /**
   * Actualizar configuración completa
   */
  updateConfiguration(config: Partial<SystemConfiguration>): Observable<ApiResponse<SystemConfiguration>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.SETTINGS);
    return this.httpService.put<SystemConfiguration>(url, config);
  }

  /**
   * Actualizar configuración por tipo
   */
  updateConfigurationByType(type: ConfigType, config: any): Observable<ApiResponse<ConfigurationResponse>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.SETTINGS_BY_TYPE(type));
    return this.httpService.put<ConfigurationResponse>(url, config);
  }

  /**
   * Subir logo de la empresa
   */
  uploadLogo(file: File): Observable<ApiResponse<LogoUploadResponse>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.SETTINGS_LOGO);
    return this.httpService.uploadFile<LogoUploadResponse>(url, file, 'logo');
  }

  /**
   * Configurar backups automáticos
   */
  configureBackups(backupConfig: BackupConfig): Observable<ApiResponse<any>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.SETTINGS_BACKUP);
    return this.httpService.post<any>(url, backupConfig);
  }

  /**
   * Obtener parámetros técnicos del sistema
   */
  getTechnicalParameters(): Observable<ApiResponse<TechnicalParameters>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.SETTINGS_TECHNICAL);
    return this.httpService.get<TechnicalParameters>(url);
  }

  /**
   * Resetear configuración a valores por defecto
   */
  resetConfiguration(type: ConfigType): Observable<ApiResponse<ConfigurationResponse>> {
    const url = this.config.getEndpointUrl(`${API_CONSTANTS.ENDPOINTS.SETTINGS_BY_TYPE(type)}/reset`);
    return this.httpService.post<ConfigurationResponse>(url, {});
  }
}