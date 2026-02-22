import { Injectable } from '@angular/core';
import { ConfigService } from './config.service';
import { User, UserPermissions, AuthTokens } from '../models/auth.model';

/**
 * Servicio de Almacenamiento
 * Sprint 2 - Autenticación y Autorización
 */
@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor(private config: ConfigService) { }

  /**
   * Determinar qué storage usar según Remember Me
   */
  private getStorage(): Storage {
    const rememberMe = localStorage.getItem(this.config.rememberMeKey) === 'true';
    return rememberMe ? localStorage : sessionStorage;
  }

  /**
   * Guardar tokens de autenticación
   */
  saveTokens(tokens: AuthTokens, rememberMe: boolean = false): void {
    localStorage.setItem(this.config.rememberMeKey, rememberMe.toString());
    
    const storage = this.getStorage();
    
    storage.setItem(this.config.tokenKey, tokens.accessToken);
    storage.setItem(this.config.refreshTokenKey, tokens.refreshToken);
  }

  /**
   * Obtener access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem(this.config.tokenKey) || 
           sessionStorage.getItem(this.config.tokenKey);
  }

  /**
   * Obtener refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.config.refreshTokenKey) || 
           sessionStorage.getItem(this.config.refreshTokenKey);
  }

  /**
   * Guardar información del usuario
   */
  saveUser(user: User): void {
    const storage = this.getStorage();
    storage.setItem(this.config.userKey, JSON.stringify(user));
  }

  /**
   * Obtener información del usuario
   */
  getUser(): User | null {
    const storage = this.getStorage();
    const userStr = storage.getItem(this.config.userKey);
    
    if (!userStr) {
      const otherStorage = storage === localStorage ? sessionStorage : localStorage;
      const otherUserStr = otherStorage.getItem(this.config.userKey);
      return otherUserStr ? JSON.parse(otherUserStr) : null;
    }
    
    return JSON.parse(userStr);
  }

  /**
   * Guardar permisos del usuario
   */
  savePermissions(permissions: UserPermissions): void {
    const storage = this.getStorage();
    storage.setItem(this.config.permissionsKey, JSON.stringify(permissions));
  }

  /**
   * Obtener permisos del usuario
   */
  getPermissions(): UserPermissions | null {
    const storage = this.getStorage();
    const permStr = storage.getItem(this.config.permissionsKey);
    
    if (!permStr) {
      const otherStorage = storage === localStorage ? sessionStorage : localStorage;
      const otherPermStr = otherStorage.getItem(this.config.permissionsKey);
      return otherPermStr ? JSON.parse(otherPermStr) : null;
    }
    
    return JSON.parse(permStr);
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * Limpiar todos los datos de autenticación
   */
  clear(): void {
    const keys = [
      this.config.tokenKey,
      this.config.refreshTokenKey,
      this.config.userKey,
      this.config.permissionsKey,
      this.config.rememberMeKey
    ];

    keys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  }

  /**
   * Actualizar solo el access token
   */
  updateAccessToken(accessToken: string): void {
    const storage = this.getStorage();
    storage.setItem(this.config.tokenKey, accessToken);
  }

  /**
   * Obtener datos completos de sesión
   */
  getSessionData(): {
    user: User | null;
    permissions: UserPermissions | null;
    accessToken: string | null;
    refreshToken: string | null;
  } {
    return {
      user: this.getUser(),
      permissions: this.getPermissions(),
      accessToken: this.getAccessToken(),
      refreshToken: this.getRefreshToken()
    };
  }
}