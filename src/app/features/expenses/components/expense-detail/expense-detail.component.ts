import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';

import { ExpenseService } from '../../services/expense.service';
import { AlertService } from '../../../../core/services/alert.service';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { Expense, PaymentMethod, PAYMENT_METHOD_LABELS, PAYMENT_METHOD_ICONS, PAYMENT_METHOD_COLORS } from '../../models/expense.model';

@Component({
  selector: 'app-expense-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './expense-detail.component.html',
  styleUrls: ['./expense-detail.component.css']
})
export class ExpenseDetailComponent implements OnInit {

  expense?: Expense;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private expenseService: ExpenseService,
    private alertService: AlertService,
    private confirmService: ConfirmationService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadExpense(+id);
  }

  private loadExpense(id: number): void {
    this.loading = true;
    this.expenseService.getExpenseById(id).subscribe({
      next: exp => { this.expense = exp; this.loading = false; },
      error: () => { this.loading = false; this.alertService.error('Error al cargar el gasto'); }
    });
  }

  // ── Acciones ──────────────────────────────────────────────────────────────

  goBack(): void { this.router.navigate(['/expenses']); }

  edit(): void {
    if (this.expense) this.router.navigate(['/expenses/edit', this.expense.id]);
  }

  confirmDelete(): void {
    if (!this.expense) return;
    this.confirmService.confirm({
      title: 'Eliminar gasto',
      message: `¿Eliminar "${this.expense.concept}" por ${this.formatCurrency(this.expense.amount)}?`,
      confirmText: 'Eliminar',
      type: 'danger'
    }).subscribe(ok => {
      if (ok) {
        this.expenseService.deleteExpense(this.expense!.id).subscribe({
          next: () => {
            this.alertService.success('Gasto eliminado');
            this.router.navigate(['/expenses']);
          },
          error: () => this.alertService.error('Error al eliminar')
        });
      }
    });
  }

  print(): void {
    window.print();
  }

  // ── Formato ───────────────────────────────────────────────────────────────

  formatCurrency(val: number): string {
    return new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(val || 0);
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d + 'T00:00:00').toLocaleDateString('es-SV', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  formatDateTime(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleString('es-SV', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  getPaymentLabel(m: PaymentMethod): string { return PAYMENT_METHOD_LABELS[m] || m; }
  getPaymentIcon(m: PaymentMethod): string { return PAYMENT_METHOD_ICONS[m] || 'bi-cash'; }
  getPaymentBadgeClass(m: PaymentMethod): string {
    const c = PAYMENT_METHOD_COLORS[m] || 'secondary';
    return `bg-${c}-subtle text-${c}`;
  }

  isImage(mime?: string): boolean {
    return !!mime && mime.startsWith('image/');
  }

  getReceiptUrl(url: string): string {
    return this.expenseService.getReceiptFullUrl(url);
  }
}
