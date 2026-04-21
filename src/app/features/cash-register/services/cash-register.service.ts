import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, interval, switchMap, startWith } from 'rxjs';
import { map, tap } from 'rxjs/operators';

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
  RegisterSaleDto,
  DENOMINATION_ALL,
  DenominationCount,
  PaymentMethod,
  CashSessionStatus,
  MovementType
} from '../models/cash-register.model';

/**
 * Servicio de Gestión de Caja
 * Sprint 14 - SmartTrade
 */
@Injectable({ providedIn: 'root' })
export class CashRegisterService {

  private readonly BASE = API_CONSTANTS.BASE_URL;
  private readonly EP   = API_CONSTANTS.ENDPOINTS;
  private readonly ACTIVE_SESSION_KEY = 'cash_register_active_session';

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
      .post<ApiResponse<any>>(`${this.BASE}${this.EP.CASH_OPEN}`,
        {
          casierId: dto.cashierId,
          cashBoxNumber: `Caja ${dto.cashNumber}`,
          baseAmount: dto.initialAmount ?? 0
        }
      )
      .pipe(
        map(res => {
          if (!res.success || !res.data) return res as ApiResponse<CashSession>;
          const session = this.mapSession(res.data, dto.cashierId);
          return { ...res, data: session } as ApiResponse<CashSession>;
        }),
        tap(res => { if (res.success && res.data) this.activeSession$.next(res.data); })
      );
  }

  /**
   * Cierra el turno de caja
   */
  closeCash(dto: CloseCashDto): Observable<ApiResponse<CashCloseReport>> {
    return this.http
      .post<ApiResponse<any>>(`${this.BASE}${this.EP.CASH_CLOSE}`,
        {
          sessionId: dto.sessionId,
          countData: this.buildCountData(dto.physicalCount || []),
          countedBy: dto.countedBy,
          verifiedBy: dto.verifiedBy,
          observations: this.buildObservations(dto.observations, dto.differenceExplanation)
        }
      )
      .pipe(
        map(res => {
          if (!res.success || !res.data) return res as ApiResponse<CashCloseReport>;
          const report = this.mapCloseReport(res.data);
          return { ...res, data: report } as ApiResponse<CashCloseReport>;
        }),
        tap(() => this.activeSession$.next(null))
      );
  }

  /**
   * Obtiene el estado/resumen actual de la caja
   */
  getCashStatus(sessionId: number): Observable<ApiResponse<CashSummary>> {
    return this.http
      .get<ApiResponse<any>>(`${this.BASE}${this.EP.CASH_STATUS(sessionId)}`)
      .pipe(map(res => this.mapStatusResponse(res)));
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
    return this.http
      .get<ApiResponse<any>>(`${this.BASE}${this.EP.CASH_ARQUEO(sessionId)}`)
      .pipe(map(res => this.mapArqueoResponse(res)));
  }

  // ─── Movimientos ─────────────────────────────────────────────────────────────

  /**
   * Registra una venta en la caja activa
   */
  registerSale(dto: RegisterSaleDto): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.BASE}${this.EP.CASH_SALE}`,
      {
        saleId: dto.saleId,
        amount: dto.amount,
        paymentMethod: this.mapPaymentMethodToApi(dto.paymentMethod)
      }
    );
  }

  /**
   * Registra un ingreso adicional
   */
  registerIncome(dto: RegisterIncomeDto): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.BASE}${this.EP.CASH_INCOME}`,
      {
        sessionId: dto.sessionId,
        amount: dto.amount,
        concept: dto.concept,
        paymentMethod: this.mapPaymentMethodToApi(dto.paymentMethod),
        description: dto.observations,
        reference: dto.customConcept
      }
    );
  }

  /**
   * Registra un egreso
   */
  registerExpense(dto: RegisterExpenseDto): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.BASE}${this.EP.CASH_EXPENSE}`,
      {
        sessionId: dto.sessionId,
        amount: dto.amount,
        concept: dto.concept,
        description: dto.observations,
        authorizedBy: dto.authorizedBy,
        reference: dto.voucherNumber
      }
    );
  }

  /**
   * Realiza un retiro parcial a caja fuerte
   */
  registerWithdrawal(dto: WithdrawalDto): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.BASE}${this.EP.CASH_WITHDRAWAL}`,
      {
        sessionId: dto.sessionId,
        amount: dto.amount,
        receivedBy: dto.receivedBy,
        description: dto.observations,
        reference: dto.authCode
      }
    );
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
      if (filters.cashierId)      params = params.set('casierId', filters.cashierId.toString());
      if (filters.cashNumber)     params = params.set('cashBoxNumber', `Caja ${filters.cashNumber}`);
      if (filters.status)         params = params.set('status', filters.status);
      if (filters.limit)          params = params.set('limit', filters.limit.toString());
      if (filters.page && filters.limit)
        params = params.set('offset', String((filters.page - 1) * filters.limit));
    }
    return this.http
      .get<ApiResponse<any>>(`${this.BASE}${this.EP.CASH_HISTORY}`, { params })
      .pipe(map(res => this.mapHistoryResponse(res)));
  }

  /**
   * Lista sesiones abiertas del cajero actual
   */
  getOpenSessionsForCashier(cashierId: number): Observable<ApiResponse<CashSession[]>> {
    let params = new HttpParams()
      .set('casierId', String(cashierId))
      .set('status', 'OPEN');

    return this.http
      .get<ApiResponse<any>>(`${this.BASE}${this.EP.CASH_HISTORY}`, { params })
      .pipe(map(res => this.mapOpenSessionsResponse(res)));
  }

  /**
   * Obtiene el detalle completo de una sesión
   */
  getSessionDetail(sessionId: number): Observable<ApiResponse<CashCloseReport>> {
    return this.http
      .get<ApiResponse<any>>(`${this.BASE}${this.EP.CASH_DETAIL(sessionId)}`)
      .pipe(map(res => this.mapDetailResponse(res)));
  }

  /**
   * Genera el PDF de reporte de cierre
   */
  generateReport(sessionId: number): Observable<Blob> {
    return this.http.get(`${this.BASE}${this.EP.CASH_REPORT(sessionId)}`, { responseType: 'blob' });
  }

  // ─── Mapeos a API ──────────────────────────────────────────────────────────

  private mapPaymentMethodToApi(method: PaymentMethod): 'CASH' | 'CARD' | 'TRANSFER' | 'CREDIT' {
    switch (method) {
      case 'card': return 'CARD';
      case 'transfer': return 'TRANSFER';
      case 'credit': return 'CREDIT';
      case 'check':
      case 'cash':
      default: return 'CASH';
    }
  }

  private mapPaymentMethodFromApi(method?: string | null): PaymentMethod {
    switch ((method || '').toUpperCase()) {
      case 'CARD': return 'card';
      case 'TRANSFER': return 'transfer';
      case 'CREDIT': return 'credit';
      case 'CASH':
      default: return 'cash';
    }
  }

  private parseCashNumber(value?: string | null): number {
    if (!value) return 0;
    const match = value.match(/(\d+)/);
    return match ? Number(match[1]) : 0;
  }

  private mapSession(data: any, fallbackCashierId?: number): CashSession {
    const cashierId = Number(data.casierId ?? data.cashierId ?? fallbackCashierId ?? 0);
    return {
      id: Number(data.id),
      cashierId,
      cashierName: data.cashierName ?? `Cajero ${cashierId || ''}`.trim(),
      cashNumber: this.parseCashNumber(data.cashBoxNumber),
      status: this.mapStatus(data.status),
      openedAt: data.openedAt,
      closedAt: data.closedAt ?? null,
      initialAmount: Number(data.baseAmount ?? 0),
      observations: data.observations ?? null
    };
  }

  private mapStatus(status?: string | null): CashSessionStatus {
    const value = (status || '').toUpperCase();
    if (value === 'CLOSED') return 'closed';
    return 'open';
  }

  private mapStatusResponse(res: ApiResponse<any>): ApiResponse<CashSummary> {
    if (!res.success || !res.data) return res as ApiResponse<CashSummary>;

    const data = res.data;
    const session = this.mapSession({
      id: data.sessionId,
      cashBoxNumber: data.cashBoxNumber,
      openedAt: data.openedAt,
      baseAmount: data.baseAmount,
      status: 'OPEN'
    });

    const salesByMethod = data.sales?.byMethod || {};
    const incomeByMethod = data.incomes?.byMethod || {};
    const lastMovements = (data.lastMovements || []).map((m: any) => this.mapMovement(m, this.mapTypeFromApi(m.type)));

    const summary: CashSummary = {
      session,
      initialAmount: Number(data.baseAmount ?? 0),
      salesCash: Number(salesByMethod.CASH ?? 0) + Number(incomeByMethod.CASH ?? 0),
      salesCard: Number(salesByMethod.CARD ?? 0) + Number(incomeByMethod.CARD ?? 0),
      salesTransfer: Number(salesByMethod.TRANSFER ?? 0) + Number(incomeByMethod.TRANSFER ?? 0),
      salesCredit: Number(salesByMethod.CREDIT ?? 0) + Number(incomeByMethod.CREDIT ?? 0),
      additionalIncome: Number(data.incomes?.total ?? 0),
      expenses: Number(data.expenses?.total ?? 0),
      withdrawals: Number(data.withdrawals?.total ?? 0),
      expectedCash: Number(data.currentTotal ?? 0),
      totalMovements: Number(data.movementCount ?? 0),
      lastMovements
    };

    return { ...res, data: summary } as ApiResponse<CashSummary>;
  }

  private mapArqueoResponse(res: ApiResponse<any>): ApiResponse<CashArqueo> {
    if (!res.success || !res.data) return res as ApiResponse<CashArqueo>;

    const data = res.data;
    const session = this.mapSession({
      id: data.sessionId,
      cashBoxNumber: data.cashBoxNumber,
      openedAt: data.openedAt,
      baseAmount: data.totals?.baseAmount ?? data.breakdown?.baseAmount,
      status: 'OPEN'
    });

    const movements = {
      sales: (data.breakdown?.sales || []).map((m: any) => this.mapMovement(m, 'sale')),
      incomes: (data.breakdown?.incomes || []).map((m: any) => this.mapMovement(m, 'income')),
      expenses: (data.breakdown?.expenses || []).map((m: any) => this.mapMovement(m, 'expense')),
      withdrawals: (data.breakdown?.withdrawals || []).map((m: any) => this.mapMovement(m, 'withdrawal'))
    };

    const salesByMethod = this.sumByPaymentMethod(data.breakdown?.sales || []);
    const incomesByMethod = this.sumByPaymentMethod(data.breakdown?.incomes || []);

    const summary: CashSummary = {
      session,
      initialAmount: Number(data.totals?.baseAmount ?? 0),
      salesCash: Number(salesByMethod['CASH'] ?? 0) + Number(incomesByMethod['CASH'] ?? 0),
      salesCard: Number(salesByMethod['CARD'] ?? 0) + Number(incomesByMethod['CARD'] ?? 0),
      salesTransfer: Number(salesByMethod['TRANSFER'] ?? 0) + Number(incomesByMethod['TRANSFER'] ?? 0),
      salesCredit: Number(salesByMethod['CREDIT'] ?? 0) + Number(incomesByMethod['CREDIT'] ?? 0),
      additionalIncome: Number(data.totals?.incomes ?? 0),
      expenses: Number(data.totals?.expenses ?? 0),
      withdrawals: Number(data.totals?.withdrawals ?? 0),
      expectedCash: Number(data.expectedTotal ?? 0),
      totalMovements: movements.sales.length + movements.incomes.length + movements.expenses.length + movements.withdrawals.length,
      lastMovements: []
    };

    return {
      ...res,
      data: {
        session,
        summary,
        expectedCash: Number(data.expectedTotal ?? 0),
        movements
      }
    } as ApiResponse<CashArqueo>;
  }

  private mapMovement(item: any, type: MovementType): any {
    return {
      id: Number(item.id ?? 0),
      sessionId: Number(item.sessionId ?? 0),
      type,
      concept: item.concept ?? item.reference ?? '-',
      amount: Number(item.amount ?? 0),
      paymentMethod: this.mapPaymentMethodFromApi(item.paymentMethod),
      registeredAt: item.createdAt ?? item.countedAt ?? new Date().toISOString(),
      authorizedBy: item.authorizedBy ?? null,
      referenceId: item.referenceId ?? null
    };
  }

  private mapTypeFromApi(type?: string | null): MovementType {
    switch ((type || '').toUpperCase()) {
      case 'SALE': return 'sale';
      case 'INCOME': return 'income';
      case 'EXPENSE': return 'expense';
      case 'WITHDRAWAL': return 'withdrawal';
      default: return 'opening';
    }
  }

  private mapHistoryResponse(res: ApiResponse<any>): ApiResponse<CashHistoryItem[]> {
    if (!res.success || !res.data) return res as ApiResponse<CashHistoryItem[]>;
    const items = (res.data as any[]).map((s) => {
      const opened = s.openedAt ? new Date(s.openedAt) : null;
      const closed = s.closedAt ? new Date(s.closedAt) : null;
      const durationMinutes = opened && closed ? Math.floor((closed.getTime() - opened.getTime()) / 60000) : 0;
      const difference = Number(s.difference ?? 0);
      const differenceType = difference === 0 ? 'exact' : (difference > 0 ? 'surplus' : 'shortage');
      return {
        id: Number(s.id),
        cashNumber: this.parseCashNumber(s.cashBoxNumber),
        cashierName: `Cajero ${s.casierId ?? ''}`.trim(),
        openedAt: s.openedAt,
        closedAt: s.closedAt,
        status: (s.status ?? 'CLOSED') as 'OPEN' | 'COUNTED' | 'CLOSED',
        durationMinutes,
        totalSales: Number(s.expectedTotal ?? 0),
        difference,
        differenceType
      };
    });
    return { ...res, data: items } as ApiResponse<CashHistoryItem[]>;
  }

  private mapDetailResponse(res: ApiResponse<any>): ApiResponse<CashCloseReport> {
    if (!res.success || !res.data) return res as ApiResponse<CashCloseReport>;
    const data = res.data;

    const session = this.mapSession({
      id: data.session?.id,
      cashBoxNumber: data.session?.cashBoxNumber,
      openedAt: data.session?.openedAt,
      closedAt: data.session?.closedAt,
      baseAmount: data.session?.baseAmount,
      status: data.session?.status
    });

    const movements = Array.isArray(data.movements) ? data.movements : [];
    const sales = movements.filter((m: any) => m.type === 'SALE');
    const incomes = movements.filter((m: any) => m.type === 'INCOME');
    const expenses = movements.filter((m: any) => m.type === 'EXPENSE');
    const withdrawals = movements.filter((m: any) => m.type === 'WITHDRAWAL');

    const salesByMethod = { CASH: 0, CARD: 0, TRANSFER: 0, CREDIT: 0 } as Record<string, number>;
    const incomeByMethod = { CASH: 0, CARD: 0, TRANSFER: 0, CREDIT: 0 } as Record<string, number>;
    sales.forEach((sale: any) => {
      if (sale.paymentMethod) {
        const key = String(sale.paymentMethod).toUpperCase();
        salesByMethod[key] = (salesByMethod[key] || 0) + Number(sale.amount ?? 0);
      }
    });

    incomes.forEach((income: any) => {
      if (income.paymentMethod) {
        const key = String(income.paymentMethod).toUpperCase();
        incomeByMethod[key] = (incomeByMethod[key] || 0) + Number(income.amount ?? 0);
      }
    });

    const totalSales = sales.reduce((sum: number, s: any) => sum + Number(s.amount ?? 0), 0);
    const totalIncomes = incomes.reduce((sum: number, i: any) => sum + Number(i.amount ?? 0), 0);
    const totalExpenses = expenses.reduce((sum: number, e: any) => sum + Number(e.amount ?? 0), 0);
    const totalWithdrawals = withdrawals.reduce((sum: number, w: any) => sum + Number(w.amount ?? 0), 0);

    const incomeByMethodTotal =
      Number(incomeByMethod['CASH'] ?? 0) +
      Number(incomeByMethod['CARD'] ?? 0) +
      Number(incomeByMethod['TRANSFER'] ?? 0) +
      Number(incomeByMethod['CREDIT'] ?? 0);
    const additionalIncome = Math.max(0, totalIncomes - incomeByMethodTotal);

    const baseAmount = Number(data.session?.baseAmount ?? 0);
    const expectedTotal = Number(data.count?.expectedAmount ?? (baseAmount + totalSales + totalIncomes - totalExpenses - totalWithdrawals));
    const physicalTotal = Number(data.count?.totalCounted ?? 0);
    const difference = Number(data.count?.difference ?? (physicalTotal - expectedTotal));
    const differenceType = difference === 0 ? 'exact' : (difference > 0 ? 'surplus' : 'shortage');

    const report: CashCloseReport = {
      session,
      summary: {
        session,
        initialAmount: baseAmount,
        salesCash: Number(salesByMethod['CASH'] ?? 0) + Number(incomeByMethod['CASH'] ?? 0),
        salesCard: Number(salesByMethod['CARD'] ?? 0) + Number(incomeByMethod['CARD'] ?? 0),
        salesTransfer: Number(salesByMethod['TRANSFER'] ?? 0) + Number(incomeByMethod['TRANSFER'] ?? 0),
        salesCredit: Number(salesByMethod['CREDIT'] ?? 0) + Number(incomeByMethod['CREDIT'] ?? 0),
        additionalIncome,
        expenses: Number(totalExpenses ?? 0),
        withdrawals: Number(totalWithdrawals ?? 0),
        expectedCash: expectedTotal,
        totalMovements: movements.length,
        lastMovements: []
      },
      physicalCount: data.count?.countData ? this.mapCountDataToDenominations(data.count.countData) : [],
      physicalTotal,
      expectedTotal,
      difference,
      differenceType,
      observations: data.count?.observations ?? null,
      closedAt: data.session?.closedAt
    };

    return { ...res, data: report } as ApiResponse<CashCloseReport>;
  }

  private mapCloseReport(data: any): CashCloseReport {
    const active = this.getActiveSession();
    const session = active ?? {
      id: Number(data.sessionId),
      cashierName: 'Cajero',
      cashierId: 0,
      cashNumber: 0,
      status: 'closed' as CashSessionStatus,
      openedAt: data.openedAt ?? new Date().toISOString(),
      closedAt: data.closedAt ?? new Date().toISOString(),
      initialAmount: Number(data.baseAmount ?? 0),
      observations: data.observations ?? null
    };

    const difference = Number(data.difference ?? 0);
    const differenceType = difference === 0 ? 'exact' : (difference > 0 ? 'surplus' : 'shortage');

    return {
      session,
      summary: {
        session,
        initialAmount: Number(data.baseAmount ?? 0),
        salesCash: 0,
        salesCard: 0,
        salesTransfer: 0,
        salesCredit: 0,
        additionalIncome: 0,
        expenses: 0,
        withdrawals: 0,
        expectedCash: Number(data.expectedTotal ?? 0),
        totalMovements: 0,
        lastMovements: []
      },
      physicalCount: [],
      physicalTotal: Number(data.physicalTotal ?? 0),
      expectedTotal: Number(data.expectedTotal ?? 0),
      difference,
      differenceType,
      observations: data.observations ?? null,
      closedAt: data.closedAt ?? new Date().toISOString()
    };
  }

  private buildCountData(physicalCount: DenominationCount[]): Record<string, number> {
    const result: Record<string, number> = {};
    physicalCount.forEach((item) => {
      if (!item.quantity) return;
      const key = item.type === 'bill'
        ? `note_${item.denomination}`
        : `coin_${item.denomination}`;
      result[key] = Number(item.quantity);
    });
    return result;
  }

  private mapCountDataToDenominations(countData: Record<string, number>): DenominationCount[] {
    return DENOMINATION_ALL.map((d) => {
      const key = d.type === 'bill' ? `note_${d.denomination}` : `coin_${d.denomination}`;
      const quantity = Number(countData[key] ?? 0);
      return {
        ...d,
        quantity,
        subtotal: quantity * d.denomination
      };
    });
  }

  private sumByPaymentMethod(items: any[]): Record<'CASH' | 'CARD' | 'TRANSFER' | 'CREDIT', number> {
    const result: Record<'CASH' | 'CARD' | 'TRANSFER' | 'CREDIT', number> = {
      CASH: 0,
      CARD: 0,
      TRANSFER: 0,
      CREDIT: 0
    };

    items.forEach((item: any) => {
      const key = String(item?.paymentMethod || '').toUpperCase();
      if (key === 'CASH' || key === 'CARD' || key === 'TRANSFER' || key === 'CREDIT') {
        result[key] += Number(item.amount ?? 0);
      }
    });

    return result;
  }

  private buildObservations(observations?: string, differenceExplanation?: string): string | undefined {
    if (observations && differenceExplanation) {
      return `${observations} | Diferencia: ${differenceExplanation}`;
    }
    return observations || differenceExplanation || undefined;
  }

  // ─── Estado local ─────────────────────────────────────────────────────────────

  getActiveSession(): CashSession | null {
    const inMemory = this.activeSession$.getValue();
    if (inMemory) return inMemory;

    const stored = this.readActiveSessionFromStorage();
    if (stored) {
      this.activeSession$.next(stored);
    }
    return stored;
  }

  setActiveSession(session: CashSession | null): void {
    this.activeSession$.next(session);
    this.persistActiveSession(session);
  }

  clearSession(): void {
    this.activeSession$.next(null);
    this.persistActiveSession(null);
  }

  private persistActiveSession(session: CashSession | null): void {
    if (!session) {
      localStorage.removeItem(this.ACTIVE_SESSION_KEY);
      return;
    }
    localStorage.setItem(this.ACTIVE_SESSION_KEY, JSON.stringify(session));
  }

  private readActiveSessionFromStorage(): CashSession | null {
    const raw = localStorage.getItem(this.ACTIVE_SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as CashSession;
    } catch {
      localStorage.removeItem(this.ACTIVE_SESSION_KEY);
      return null;
    }
  }

  private mapOpenSessionsResponse(res: ApiResponse<any>): ApiResponse<CashSession[]> {
    if (!res.success || !res.data) return res as ApiResponse<CashSession[]>;
    const sessions = (res.data as any[]).map((s) => this.mapSession({
      id: s.id,
      cashBoxNumber: s.cashBoxNumber,
      openedAt: s.openedAt,
      closedAt: s.closedAt,
      baseAmount: s.baseAmount,
      status: s.status,
      casierId: s.casierId
    }));
    return { ...res, data: sessions } as ApiResponse<CashSession[]>;
  }
}
