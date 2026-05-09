import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

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
    this.loadSummary();

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
        this.highestExpense = [...res.rows].sort((a, b) => b.amount - a.amount)[0];
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
    this.expenseService.getTotalByPeriod(this.filters.startDate, this.filters.endDate)
      .subscribe({ next: r => this.totalReport = r });

    this.expenseService.getExpensesByCategory(this.filters.startDate, this.filters.endDate)
      .subscribe({
        next: items => {
          this.topCategory = items.sort((a, b) => b.total - a.total)[0];
        }
      });
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
    this.alertService.info('Funcionalidad de exportación disponible próximamente');
  }

  // ── Formato ───────────────────────────────────────────────────────────────

  formatCurrency(val: number): string {
    return new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(val || 0);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-SV', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
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
