import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { HttpService } from '../../../core/services/http.service';
import { API_CONSTANTS } from '../../../core/constants/api.constants';
import {
  Expense, CreateExpenseDto, UpdateExpenseDto, ExpenseListResponse,
  ExpenseCategory, CreateCategoryDto,
  ExpenseReceipt,
  ExpenseRecurring, CreateRecurringDto,
  ExpenseByCategoryItem, ExpenseTotalReport,
  ExpenseFilters
} from '../models/expense.model';

const { ENDPOINTS, BASE_URL } = API_CONSTANTS;

@Injectable({ providedIn: 'root' })
export class ExpenseService {

  constructor(private http: HttpService) {}

  // ─── Categorías ─────────────────────────────────────────────────────────────

  getCategories(type?: string): Observable<ExpenseCategory[]> {
    const url = `${BASE_URL}${ENDPOINTS.EXPENSES_CATEGORIES}`;
    return this.http.get<ExpenseCategory[]>(url, type ? { type } : undefined)
      .pipe(map(r => r.data ?? []));
  }

  createCategory(dto: CreateCategoryDto): Observable<ExpenseCategory> {
    const url = `${BASE_URL}${ENDPOINTS.EXPENSES_CATEGORIES}`;
    return this.http.post<ExpenseCategory>(url, dto)
      .pipe(map(r => r.data!));
  }

  // ─── Gastos ──────────────────────────────────────────────────────────────────

  getExpenses(filters?: ExpenseFilters): Observable<ExpenseListResponse> {
    const url = `${BASE_URL}${ENDPOINTS.EXPENSES_EXPENSES}`;
    return this.http.get<ExpenseListResponse>(url, filters)
      .pipe(map(r => r.data ?? { rows: [], count: 0, page: 1, limit: 20 }));
  }

  getExpenseById(id: number): Observable<Expense> {
    const url = `${BASE_URL}${ENDPOINTS.EXPENSES_BY_ID(id)}`;
    return this.http.get<Expense>(url)
      .pipe(map(r => r.data!));
  }

  createExpense(dto: CreateExpenseDto): Observable<Expense> {
    const url = `${BASE_URL}${ENDPOINTS.EXPENSES_EXPENSES}`;
    return this.http.post<Expense>(url, dto)
      .pipe(map(r => r.data!));
  }

  updateExpense(id: number, dto: UpdateExpenseDto): Observable<Expense> {
    const url = `${BASE_URL}${ENDPOINTS.EXPENSES_BY_ID(id)}`;
    return this.http.put<Expense>(url, dto)
      .pipe(map(r => r.data!));
  }

  deleteExpense(id: number, reason?: string): Observable<any> {
    const url = `${BASE_URL}${ENDPOINTS.EXPENSES_BY_ID(id)}`;
    // Use HttpClient directly for DELETE with body
    return this.http.delete<any>(url)
      .pipe(map(r => r.data));
  }

  // ─── Comprobantes ─────────────────────────────────────────────────────────

  uploadReceipt(expenseId: number, file: File): Observable<ExpenseReceipt> {
    const url = `${BASE_URL}${ENDPOINTS.EXPENSES_RECEIPT(expenseId)}`;
    return this.http.uploadFile<ExpenseReceipt>(url, file, 'comprobante')
      .pipe(map(r => r.data!));
  }

  // ─── Gastos Recurrentes ───────────────────────────────────────────────────

  getRecurrings(active?: boolean): Observable<ExpenseRecurring[]> {
    const url = `${BASE_URL}${ENDPOINTS.EXPENSES_RECURRINGS}`;
    const params = active !== undefined ? { active: active.toString() } : undefined;
    return this.http.get<ExpenseRecurring[]>(url, params)
      .pipe(map(r => r.data ?? []));
  }

  createRecurring(dto: CreateRecurringDto): Observable<ExpenseRecurring> {
    const url = `${BASE_URL}${ENDPOINTS.EXPENSES_RECURRINGS}`;
    return this.http.post<ExpenseRecurring>(url, dto)
      .pipe(map(r => r.data!));
  }

  // ─── Reportes ────────────────────────────────────────────────────────────

  getExpensesByCategory(startDate?: string, endDate?: string): Observable<ExpenseByCategoryItem[]> {
    const url = `${BASE_URL}${ENDPOINTS.EXPENSES_REPORT_BY_CATEGORY}`;
    return this.http.get<ExpenseByCategoryItem[]>(url, { startDate, endDate })
      .pipe(
        map(r => {
          const items = r.data ?? [];
          const total = items.reduce((s, i) => s + (i.total || 0), 0);
          return items.map(i => ({
            ...i,
            percentage: total > 0 ? Math.round((i.total / total) * 100) : 0
          }));
        })
      );
  }

  getTotalByPeriod(startDate?: string, endDate?: string): Observable<ExpenseTotalReport> {
    const url = `${BASE_URL}${ENDPOINTS.EXPENSES_REPORT_TOTAL}`;
    return this.http.get<ExpenseTotalReport>(url, { startDate, endDate })
      .pipe(map(r => r.data ?? { total: 0, avgDaily: 0 }));
  }

  /** Devuelve el gasto con el monto más alto del periodo */
  getHighestExpense(startDate?: string, endDate?: string): Observable<Expense | undefined> {
    const url = `${BASE_URL}${ENDPOINTS.EXPENSES_EXPENSES}`;
    return this.http.get<ExpenseListResponse>(url, { startDate, endDate, limit: 1, page: 1, sortBy: 'amount', sortDir: 'DESC' })
      .pipe(map(r => (r.data?.rows ?? [])[0]));
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  /** Devuelve la URL completa del comprobante */
  getReceiptFullUrl(relativeUrl: string): string {
    return `http://localhost:3000${relativeUrl}`;
  }

  /** Devuelve el nombre de mes/año para filtros rápidos */
  getCurrentMonthRange(): { startDate: string; endDate: string } {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  }

  getPreviousMonthRange(): { startDate: string; endDate: string } {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  }
}
