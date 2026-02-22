import { Injectable } from '@angular/core';
import { API_CONSTANTS } from '../constants/api.constants';
import { APP_CONSTANTS } from '../constants/app.constants';
import { AUTH_CONSTANTS } from '../constants/auth.constants';

/**
 * Servicio de Configuración Central
 * Punto único de acceso a todas las configuraciones
 */
@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  // API Configuration
  get apiUrl(): string {
    return API_CONSTANTS.BASE_URL;
  }

  get apiTimeout(): number {
    return API_CONSTANTS.TIMEOUT;
  }

  // App Configuration
  get appName(): string {
    return APP_CONSTANTS.APP_NAME;
  }

  get appVersion(): string {
    return APP_CONSTANTS.VERSION;
  }

  // Auth Configuration
  get tokenKey(): string {
    return AUTH_CONSTANTS.STORAGE.TOKEN_KEY;
  }

  get refreshTokenKey(): string {
    return AUTH_CONSTANTS.STORAGE.REFRESH_TOKEN_KEY;
  }

  get userKey(): string {
    return AUTH_CONSTANTS.STORAGE.USER_KEY;
  }

  get permissionsKey(): string {
    return AUTH_CONSTANTS.STORAGE.PERMISSIONS_KEY;
  }

  get rememberMeKey(): string {
    return AUTH_CONSTANTS.STORAGE.REMEMBER_ME_KEY;
  }

  get sessionTimeout(): number {
    return AUTH_CONSTANTS.SESSION.TIMEOUT_MS;
  }

  // Environment
  get isProduction(): boolean {
    return false; // TODO: Detectar desde window.location o process
  }

  get isDevelopment(): boolean {
    return !this.isProduction;
  }

  /**
   * Obtener URL completa de endpoint
   */
  getEndpointUrl(endpoint: string): string {
    return `${this.apiUrl}${endpoint}`;
  }

  /**
   * Reemplazar parámetros en URL
   */
  replaceUrlParams(url: string, params: Record<string, string | number>): string {
    let result = url;
    Object.entries(params).forEach(([key, value]) => {
      result = result.replace(`:${key}`, String(value));
    });
    return result;
  }
}