import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';

import { HttpService } from '../../../core/services/http.service';
import { ConfigService } from '../../../core/services/config.service';
import { ApiResponse } from '../../../core/models/api-response.model';
import { API_CONSTANTS } from '../../../core/constants/api.constants';
import {
  Employee,
  EmployeeFilters,
  EmployeeListResponse,
  CreateEmployeeDto,
  TodayAttendance,
  AttendanceHistory,
  AttendanceRecord
} from '../models/employee.model';

/**
 * Servicio de Empleados
 * Sprint 4 - Gestión de Empleados
 */
@Injectable({
  providedIn: 'root'
})
export class EmployeeService {

  constructor(
    private httpService: HttpService,
    private config: ConfigService,
    private httpClient: HttpClient
  ) {}

  getEmployees(filters: EmployeeFilters = {}): Observable<ApiResponse<EmployeeListResponse>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.EMPLOYEES);
    return this.httpService.get<EmployeeListResponse>(url, filters);
  }

  getEmployeeById(id: number): Observable<ApiResponse<Employee>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.EMPLOYEES_BY_ID(id));
    return this.httpService.get<Employee>(url);
  }

  createEmployee(dto: CreateEmployeeDto): Observable<ApiResponse<Employee>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.EMPLOYEES);
    return this.httpService.post<Employee>(url, dto);
  }

  updateEmployee(id: number, dto: Partial<CreateEmployeeDto>): Observable<ApiResponse<Employee>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.EMPLOYEES_BY_ID(id));
    return this.httpService.put<Employee>(url, dto);
  }

  deleteEmployee(id: number): Observable<ApiResponse<{ message: string }>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.EMPLOYEES_BY_ID(id));
    return this.httpService.delete<{ message: string }>(url);
  }

  // PATCH — HttpClient directo (HttpService no tiene patch)
  linkUser(
    id: number,
    userId: number | null
  ): Observable<ApiResponse<{ message: string; employee: Employee }>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.EMPLOYEES_LINK_USER(id));
    return this.httpClient
      .patch<ApiResponse<{ message: string; employee: Employee }>>(url, { userId })
      .pipe(timeout(API_CONSTANTS.TIMEOUT));
  }

  getTodayAttendance(id: number): Observable<ApiResponse<TodayAttendance>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.EMPLOYEES_ATTENDANCE_TODAY(id));
    return this.httpService.get<TodayAttendance>(url);
  }

  getAttendanceHistory(
    id: number,
    params: { startDate?: string; endDate?: string; page?: number; limit?: number } = {}
  ): Observable<ApiResponse<AttendanceHistory>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.EMPLOYEES_ATTENDANCE(id));
    return this.httpService.get<AttendanceHistory>(url, params);
  }

  recordAttendance(
    id: number,
    type: 'entry' | 'exit',
    notes?: string
  ): Observable<ApiResponse<{
    type: string;
    timestamp: string;
    employee: { id: number; fullName: string };
    record: AttendanceRecord;
  }>> {
    const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.EMPLOYEES_ATTENDANCE(id));
    const body: any = { type };
    if (notes?.trim()) body.notes = notes.trim();
    return this.httpService.post(url, body);
  }
}
