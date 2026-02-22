import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';

import { StorageService } from '../services/storage.service';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor de Autenticación
 * Sprint 2 - Autenticación y Autorización
 * 
 * Agrega el token a todas las peticiones HTTP
 * Maneja errores 401 y refresca el token automáticamente
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(
    private storage: StorageService,
    private authService: AuthService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Agregar token si existe
    const token = this.storage.getAccessToken();
    
    if (token) {
      request = this.addToken(request, token);
    }

    return next.handle(request).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          return this.handle401Error(request, next);
        }

        return throwError(() => error);
      })
    );
  }

  /**
   * Agregar token al request
   */
  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  /**
   * Manejar error 401 (No autorizado)
   */
  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      const refreshToken = this.storage.getRefreshToken();

      if (refreshToken) {
        return this.authService.refreshToken().pipe(
          switchMap((response: any) => {
            this.isRefreshing = false;
            
            if (response.success && response.data) {
              this.refreshTokenSubject.next(response.data.accessToken);
              return next.handle(this.addToken(request, response.data.accessToken));
            }

            // Si el refresh falló, hacer logout
            this.authService.logoutLocal();
            return throwError(() => new Error('Token refresh failed'));
          }),
          catchError((err) => {
            this.isRefreshing = false;
            this.authService.logoutLocal();
            return throwError(() => err);
          })
        );
      } else {
        // No hay refresh token, hacer logout
        this.isRefreshing = false;
        this.authService.logoutLocal();
        return throwError(() => new Error('No refresh token'));
      }
    } else {
      // Esperar a que termine el refresh actual
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap((token) => next.handle(this.addToken(request, token)))
      );
    }
  }
}