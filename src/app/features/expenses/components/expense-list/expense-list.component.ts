import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, timer, switchMap, catchError, of } from 'rxjs';

import { ExpenseService } from '../../services/expense.service';
import { AlertService } from '../../../../core/services/alert.service';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import {
  Expense, ExpenseCategory, ExpenseByCategoryItem, ExpenseTotalReport,
  ExpenseFilters, PaymentMethod,
  PAYMENT_METHOD_LABELS, PAYMENT_METHOD_ICONS, PAYMENT_METHOD_COLORS
} from '../../models/expense.model';

type SortField = 'date' | 'amount' | 'category';
type SortDir = 'asc' | 'desc';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './expense-list.component.html',
  styleUrls: ['./expense-list.component.css']
})
export class ExpenseListComponent implements OnInit, OnDestroy {

  // ── Data ──────────────────────────────────────────────────────────────────
  expenses: Expense[] = [];
  filteredExpenses: Expense[] = [];
  categories: ExpenseCategory[] = [];
  totalReport: ExpenseTotalReport = { total: 0, avgDaily: 0 };
  topCategory?: ExpenseByCategoryItem;
  highestExpense?: Expense;

  // ── UI state ──────────────────────────────────────────────────────────────
  loading = false;
  quickPeriod: 'current' | 'prev' | 'custom' = 'current';
  searchTerm = '';
  sortField: SortField = 'date';
  sortDir: SortDir = 'desc';

  // ── Pagination ────────────────────────────────────────────────────────────
  currentPage = 1;
  pageSize = 20;
  totalCount = 0;
  totalPages = 1;

  // ── Filters ───────────────────────────────────────────────────────────────
  filters: ExpenseFilters = {};

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();
  private readonly POLL_INTERVAL_MS = 30_000; // Refresca tarjetas cada 30 s
  lastUpdated: Date = new Date();

  constructor(
    private expenseService: ExpenseService,
    private alertService: AlertService,
    private confirmService: ConfirmationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.setCurrentMonth();
    this.loadCategories();
    this.loadExpenses();

    // Polling en tiempo real: ejecuta inmediatamente y luego cada POLL_INTERVAL_MS
    timer(0, this.POLL_INTERVAL_MS)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => {
          this.lastUpdated = new Date();
          return this.expenseService.getTotalByPeriod(this.filters.startDate, this.filters.endDate)
            .pipe(catchError(err => { console.error('[Resumen] totalByPeriod error:', err); return of({ total: 0, avgDaily: 0 }); }));
        })
      )
      .subscribe({ next: r => this.totalReport = r });

    timer(0, this.POLL_INTERVAL_MS)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() =>
          this.expenseService.getExpensesByCategory(this.filters.startDate, this.filters.endDate)
            .pipe(catchError(err => { console.error('[Resumen] expensesByCategory error:', err); return of([]); }))
        )
      )
      .subscribe({ next: items => this.topCategory = items.sort((a, b) => b.total - a.total)[0] });

    timer(0, this.POLL_INTERVAL_MS)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() =>
          this.expenseService.getHighestExpense(this.filters.startDate, this.filters.endDate)
            .pipe(catchError(err => { console.error('[Resumen] highestExpense error:', err); return of(undefined); }))
        )
      )
      .subscribe({ next: exp => this.highestExpense = exp });

    this.searchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => this.applyLocalFilter());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Carga ─────────────────────────────────────────────────────────────────

  private setCurrentMonth(): void {
    const range = this.expenseService.getCurrentMonthRange();
    this.filters.startDate = range.startDate;
    this.filters.endDate = range.endDate;
  }

  loadCategories(): void {
    this.expenseService.getCategories().subscribe({
      next: cats => this.categories = cats,
      error: () => {}
    });
  }

  loadExpenses(): void {
    this.loading = true;
    const params: ExpenseFilters = {
      ...this.filters,
      page: this.currentPage,
      limit: this.pageSize
    };

    this.expenseService.getExpenses(params).subscribe({
      next: res => {
        this.expenses = res.rows;
        this.totalCount = res.count;
        this.totalPages = Math.ceil(res.count / this.pageSize);
        this.applyLocalFilter();
        this.loading = false;
      },
      error: err => {
        this.loading = false;
        this.alertService.error('Error al cargar gastos');
      }
    });
  }

  loadSummary(): void {
    this.lastUpdated = new Date();
    this.expenseService.getTotalByPeriod(this.filters.startDate, this.filters.endDate)
      .subscribe({ next: r => this.totalReport = r });

    this.expenseService.getExpensesByCategory(this.filters.startDate, this.filters.endDate)
      .subscribe({
        next: items => {
          this.topCategory = items.sort((a, b) => b.total - a.total)[0];
        }
      });

    this.expenseService.getHighestExpense(this.filters.startDate, this.filters.endDate)
      .subscribe({ next: exp => this.highestExpense = exp });
  }

  // ── Filtros ───────────────────────────────────────────────────────────────

  onQuickPeriodChange(): void {
    if (this.quickPeriod === 'current') {
      const r = this.expenseService.getCurrentMonthRange();
      this.filters.startDate = r.startDate;
      this.filters.endDate = r.endDate;
    } else if (this.quickPeriod === 'prev') {
      const r = this.expenseService.getPreviousMonthRange();
      this.filters.startDate = r.startDate;
      this.filters.endDate = r.endDate;
    }
    if (this.quickPeriod !== 'custom') {
      this.loadExpenses();
      this.loadSummary();
    }
  }

  onSearch(): void {
    this.searchSubject.next(this.searchTerm);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyLocalFilter();
  }

  private applyLocalFilter(): void {
    let list = [...this.expenses];
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      list = list.filter(e =>
        e.concept.toLowerCase().includes(term) ||
        e.category?.name.toLowerCase().includes(term) ||
        (e.receiptNumber || '').toLowerCase().includes(term)
      );
    }
    this.filteredExpenses = this.sortList(list);
  }

  // ── Ordenamiento ──────────────────────────────────────────────────────────

  sortBy(field: SortField): void {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDir = 'desc';
    }
    this.applyLocalFilter();
  }

  private sortList(list: Expense[]): Expense[] {
    return list.sort((a, b) => {
      let cmp = 0;
      if (this.sortField === 'date') cmp = a.date.localeCompare(b.date);
      else if (this.sortField === 'amount') cmp = a.amount - b.amount;
      else if (this.sortField === 'category') cmp = (a.category?.name || '').localeCompare(b.category?.name || '');
      return this.sortDir === 'asc' ? cmp : -cmp;
    });
  }

  getSortIcon(field: SortField): string {
    if (this.sortField !== field) return 'bi-arrow-down-up text-muted';
    return this.sortDir === 'asc' ? 'bi-sort-up' : 'bi-sort-down';
  }

  // ── Paginación ────────────────────────────────────────────────────────────

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadExpenses();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  // ── Acciones ──────────────────────────────────────────────────────────────

  newExpense(): void { this.router.navigate(['/expenses/new']); }
  viewExpense(exp: Expense): void { this.router.navigate(['/expenses/detail', exp.id]); }
  editExpense(exp: Expense): void { this.router.navigate(['/expenses/edit', exp.id]); }
  goToRecurring(): void { this.router.navigate(['/expenses/recurring']); }
  goToCategories(): void { this.router.navigate(['/expenses/categories']); }
  goToReport(): void { this.router.navigate(['/expenses/report']); }

  confirmDelete(exp: Expense): void {
    this.confirmService.confirm({
      title: 'Eliminar gasto',
      message: `¿Eliminar el gasto "${exp.concept}" por ${this.formatCurrency(exp.amount)}?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger'
    }).subscribe(confirmed => {
      if (confirmed) this.deleteExpense(exp);
    });
  }

  private deleteExpense(exp: Expense): void {
    this.expenseService.deleteExpense(exp.id).subscribe({
      next: () => {
        this.alertService.success('Gasto eliminado correctamente');
        this.loadExpenses();
        this.loadSummary();
      },
      error: () => this.alertService.error('Error al eliminar el gasto')
    });
  }

  exportExcel(): void {
    if (!this.filteredExpenses || this.filteredExpenses.length === 0) {
      this.alertService.info('No hay datos para exportar en el período seleccionado.');
      return;
    }

    // Encabezados
    const headers = ['Fecha', 'Categoría', 'Concepto', 'Monto (USD)', 'Método de Pago', 'Nº Comprobante', 'Notas'];

    // Filas de datos
    const rows = this.filteredExpenses.map(exp => [
      this.formatDate(exp.date),
      exp.category?.name ?? '—',
      exp.concept,
      Number(exp.amount).toFixed(2),
      this.getPaymentLabel(exp.paymentMethod),
      exp.receiptNumber ?? '—',
      exp.notes ?? ''
    ]);

    // Construye tabla HTML que Excel interpreta como .xls nativo
    const tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:x="urn:schemas-microsoft-com:office:excel"
            xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="UTF-8">
        <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets>
          <x:ExcelWorksheet><x:Name>Gastos Operativos</x:Name>
          <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
          </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
      </head>
      <body>
        <table border="1">
          <thead>
            <tr style="background:#d32f2f;color:#fff;font-weight:bold;">
              ${headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map((row, i) => `
              <tr style="background:${i % 2 === 0 ? '#fff' : '#f5f5f5'}">
                ${row.map(cell => `<td>${cell}</td>`).join('')}
              </tr>`).join('')}
            <tr style="font-weight:bold;background:#ffeaea;">
              <td colspan="3">TOTAL</td>
              <td>${this.filteredExpenses.reduce((s, e) => s + Number(e.amount), 0).toFixed(2)}</td>
              <td colspan="3"></td>
            </tr>
          </tbody>
        </table>
      </body></html>`;

    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    const now  = new Date();
    const stamp = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
    a.href     = url;
    a.download = `gastos_operativos_${stamp}.xls`;
    a.click();
    URL.revokeObjectURL(url);
    this.alertService.success(`Archivo exportado: ${this.filteredExpenses.length} registros`);
  }

  // ── Formato ───────────────────────────────────────────────────────────────

  formatCurrency(val: number): string {
    return new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(val || 0);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T00:00:00');
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(2);
    return `${dd}/${mm}/${yy}`;
  }

  getPaymentLabel(method: PaymentMethod): string {
    return PAYMENT_METHOD_LABELS[method] || method;
  }

  getPaymentIcon(method: PaymentMethod): string {
    return PAYMENT_METHOD_ICONS[method] || 'bi-cash';
  }

  getPaymentBadgeClass(method: PaymentMethod): string {
    const color = PAYMENT_METHOD_COLORS[method] || 'secondary';
    return `bg-${color}-subtle text-${color}`;
  }
}
