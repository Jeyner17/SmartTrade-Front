import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError, timeout, catchError } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { API_CONSTANTS } from '../constants/api.constants';

/**
 * Servicio HTTP Base
 * Wrapper para HttpClient con manejo de errores y timeout
 */
@Injectable({
  providedIn: 'root'
})
export class HttpService {

  constructor(private httpClient: HttpClient) { }

  /**
   * GET request
   */
  get<T>(url: string, params?: any): Observable<ApiResponse<T>> {
    const httpParams = this.buildParams(params);
    
    return this.httpClient
      .get<ApiResponse<T>>(url, { params: httpParams })
      .pipe(
        timeout(API_CONSTANTS.TIMEOUT),
        catchError(this.handleError)
      );
  }

  /**
   * POST request
   */
  post<T>(url: string, body: any): Observable<ApiResponse<T>> {
    return this.httpClient
      .post<ApiResponse<T>>(url, body)
      .pipe(
        timeout(API_CONSTANTS.TIMEOUT),
        catchError(this.handleError)
      );
  }

  /**
   * PUT request
   */
  put<T>(url: string, body: any): Observable<ApiResponse<T>> {
    return this.httpClient
      .put<ApiResponse<T>>(url, body)
      .pipe(
        timeout(API_CONSTANTS.TIMEOUT),
        catchError(this.handleError)
      );
  }

  /**
   * DELETE request
   */
  delete<T>(url: string): Observable<ApiResponse<T>> {
    return this.httpClient
      .delete<ApiResponse<T>>(url)
      .pipe(
        timeout(API_CONSTANTS.TIMEOUT),
        catchError(this.handleError)
      );
  }

  /**
   * Upload file
   */
  uploadFile<T>(url: string, file: File, fieldName: string = 'file'): Observable<ApiResponse<T>> {
    const formData = new FormData();
    formData.append(fieldName, file);

    return this.httpClient
      .post<ApiResponse<T>>(url, formData)
      .pipe(
        timeout(API_CONSTANTS.TIMEOUT),
        catchError(this.handleError)
      );
  }

  /**
   * Construir HttpParams desde objeto
   */
  private buildParams(params?: any): HttpParams {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }

    return httpParams;
  }

  /**
   * Manejo de errores
   * Propaga el HttpErrorResponse original para que los componentes puedan
   * acceder a err.status, err.error y demás propiedades HTTP.
   */
  private handleError(error: any): Observable<never> {
    console.error('HTTP Error:', error);
    return throwError(() => error);
  }
}