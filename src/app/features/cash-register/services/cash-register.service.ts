import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, interval, switchMap, startWith } from 'rxjs';
import { tap } from 'rxjs/operators';

import { API_CONSTANTS } from '../../../core/constants/api.constants';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  CashSession,
  CashSummary,
  CashArqueo,
  CashCloseReport,
  CashHistoryItem,
  CashHistoryFilters,
  OpenCashDto,
  RegisterIncomeDto,
  RegisterExpenseDto,
  WithdrawalDto,
  CloseCashDto,
  RegisterSaleDto
} from '../models/cash-register.model';

/**
 * Servicio de Gestión de Caja
 * Sprint 14 - SmartTrade
 */
@Injectable({ providedIn: 'root' })
export class CashRegisterService {

  private readonly BASE = API_CONSTANTS.BASE_URL;
  private readonly EP   = API_CONSTANTS.ENDPOINTS;

  /** Sesión activa en memoria */
  private activeSession$ = new BehaviorSubject<CashSession | null>(null);
  readonly session$ = this.activeSession$.asObservable();

  constructor(private http: HttpClient) {}

  // ─── Sesión ──────────────────────────────────────────────────────────────────

  /**
   * Abre un turno de caja
   */
  openCash(dto: OpenCashDto): Observable<ApiResponse<CashSession>> {
    return this.http
      .post<ApiResponse<CashSession>>(`${this.BASE}${this.EP.CASH_OPEN}`, dto)
      .pipe(tap(res => { if (res.success && res.data) this.activeSession$.next(res.data); }));
  }

  /**
   * Cierra el turno de caja
   */
  closeCash(dto: CloseCashDto): Observable<ApiResponse<CashCloseReport>> {
    return this.http
      .post<ApiResponse<CashCloseReport>>(`${this.BASE}${this.EP.CASH_CLOSE(dto.sessionId)}`, dto)
      .pipe(tap(() => this.activeSession$.next(null)));
  }

  /**
   * Obtiene el estado/resumen actual de la caja
   */
  getCashStatus(sessionId: number): Observable<ApiResponse<CashSummary>> {
    return this.http.get<ApiResponse<CashSummary>>(`${this.BASE}${this.EP.CASH_STATUS(sessionId)}`);
  }

  /**
   * Stream que refresca el estado cada 60 segundos
   */
  getCashStatusPolling(sessionId: number): Observable<ApiResponse<CashSummary>> {
    return interval(60_000).pipe(
      startWith(0),
      switchMap(() => this.getCashStatus(sessionId))
    );
  }

  /**
   * Realiza el arqueo (pre-cierre) de la caja
   */
  getArqueo(sessionId: number): Observable<ApiResponse<CashArqueo>> {
    return this.http.get<ApiResponse<CashArqueo>>(`${this.BASE}${this.EP.CASH_ARQUEO(sessionId)}`);
  }

  // ─── Movimientos ─────────────────────────────────────────────────────────────

  /**
   * Registra una venta en la caja activa
   */
  registerSale(dto: RegisterSaleDto): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.BASE}${this.EP.CASH_SALE(dto.sessionId)}`, dto);
  }

  /**
   * Registra un ingreso adicional
   */
  registerIncome(dto: RegisterIncomeDto): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.BASE}${this.EP.CASH_INCOME(dto.sessionId)}`, dto);
  }

  /**
   * Registra un egreso
   */
  registerExpense(dto: RegisterExpenseDto): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.BASE}${this.EP.CASH_EXPENSE(dto.sessionId)}`, dto);
  }

  /**
   * Realiza un retiro parcial a caja fuerte
   */
  registerWithdrawal(dto: WithdrawalDto): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.BASE}${this.EP.CASH_WITHDRAWAL(dto.sessionId)}`, dto);
  }

  // ─── Historial y Detalle ─────────────────────────────────────────────────────

  /**
   * Lista el historial de sesiones con filtros opcionales
   */
  getHistory(filters?: CashHistoryFilters): Observable<ApiResponse<CashHistoryItem[]>> {
    let params = new HttpParams();
    if (filters) {
      if (filters.startDate)      params = params.set('startDate', filters.startDate);
      if (filters.endDate)        params = params.set('endDate', filters.endDate);
      if (filters.cashierId)      params = params.set('cashierId', filters.cashierId.toString());
      if (filters.cashNumber)     params = params.set('cashNumber', filters.cashNumber.toString());
      if (filters.withDifferences != null)
        params = params.set('withDifferences', filters.withDifferences.toString());
      if (filters.page)           params = params.set('page', filters.page.toString());
      if (filters.limit)          params = params.set('limit', filters.limit.toString());
    }
    return this.http.get<ApiResponse<CashHistoryItem[]>>(`${this.BASE}${this.EP.CASH_HISTORY}`, { params });
  }

  /**
   * Obtiene el detalle completo de una sesión
   */
  getSessionDetail(sessionId: number): Observable<ApiResponse<CashCloseReport>> {
    return this.http.get<ApiResponse<CashCloseReport>>(`${this.BASE}${this.EP.CASH_DETAIL(sessionId)}`);
  }

  /**
   * Genera el PDF de reporte de cierre
   */
  generateReport(sessionId: number): Observable<Blob> {
    return this.http.get(`${this.BASE}${this.EP.CASH_REPORT(sessionId)}`, { responseType: 'blob' });
  }

  // ─── Estado local ─────────────────────────────────────────────────────────────

  getActiveSession(): CashSession | null {
    return this.activeSession$.getValue();
  }

  setActiveSession(session: CashSession | null): void {
    this.activeSession$.next(session);
  }

  clearSession(): void {
    this.activeSession$.next(null);
  }
}
