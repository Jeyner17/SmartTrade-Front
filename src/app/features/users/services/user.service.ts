import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';

import { HttpService } from '../../../core/services/http.service';
import { ConfigService } from '../../../core/services/config.service';
import { ApiResponse } from '../../../core/models/api-response.model';
import { API_CONSTANTS } from '../../../core/constants/api.constants';
import {
  User,
  UserSession,
  UserListResponse,
  CreateUserDto,
  UpdateUserDto,
  UserFilters,
  UserStatus,
  AvailabilityResult,
  Role
} from '../models/user.model';

/**
 * Servicio de Usuarios
 * Sprint 3 - Gestión de Usuarios
 */
@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(
    private httpService: HttpService,
    private config: ConfigService,
    private httpClient: HttpClient
  ) {}

  getUsers(filters: UserFilters = {}): Observable<ApiResponse<UserListResponse>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.USERS);
    return this.httpService.get<UserListResponse>(url, filters);
  }

  getUserById(id: number): Observable<ApiResponse<{ user: User }>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.USERS_BY_ID(id));
    return this.httpService.get<{ user: User }>(url);
  }

  createUser(dto: CreateUserDto): Observable<ApiResponse<{ user: User; temporaryPassword: string; mustChangePassword: boolean }>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.USERS);
    return this.httpService.post<{ user: User; temporaryPassword: string; mustChangePassword: boolean }>(url, dto);
  }

  updateUser(id: number, dto: UpdateUserDto): Observable<ApiResponse<{ user: User }>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.USERS_BY_ID(id));
    return this.httpService.put<{ user: User }>(url, dto);
  }

  deleteUser(id: number): Observable<ApiResponse<any>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.USERS_BY_ID(id));
    return this.httpService.delete<any>(url);
  }

  // PATCH requiere HttpClient directo (HttpService solo tiene GET/POST/PUT/DELETE)
  changeStatus(id: number, status: UserStatus): Observable<ApiResponse<{ user: User }>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.USERS_STATUS(id));
    return this.httpClient
      .patch<ApiResponse<{ user: User }>>(url, { status })
      .pipe(timeout(API_CONSTANTS.TIMEOUT));
  }

  resetPassword(id: number, newPassword?: string): Observable<ApiResponse<{ temporaryPassword?: string }>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.USERS_RESET_PASSWORD(id));
    const body = newPassword ? { newPassword } : {};
    return this.httpService.post<{ temporaryPassword?: string }>(url, body);
  }

  getUserSessions(id: number): Observable<ApiResponse<{ sessions: UserSession[] }>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.USERS_SESSIONS(id));
    return this.httpService.get<{ sessions: UserSession[] }>(url);
  }

  logoutAllSessions(id: number): Observable<ApiResponse<any>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.USERS_LOGOUT_ALL(id));
    return this.httpService.post<any>(url, {});
  }

  checkAvailability(
    username?: string,
    email?: string,
    excludeId?: number
  ): Observable<ApiResponse<AvailabilityResult>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.USERS_CHECK_AVAILABILITY);
    const body: any = {};
    if (username) body.username = username;
    if (email) body.email = email;
    if (excludeId) body.excludeId = excludeId;
    return this.httpService.post<AvailabilityResult>(url, body);
  }

  getRoles(): Observable<ApiResponse<{ roles: Role[] }>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.ROLES);
    return this.httpService.get<{ roles: Role[] }>(url);
  }
}
