import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { CashRegisterService } from '../../services/cash-register.service';
import { AlertService } from '../../../../core/services/alert.service';
import { CashSummary, CashMovement, MOVEMENT_TYPE_LABELS, PAYMENT_METHOD_LABELS } from '../../models/cash-register.model';
import { IncomeModalComponent } from '../income-modal/income-modal.component';
import { ExpenseModalComponent } from '../expense-modal/expense-modal.component';
import { WithdrawalModalComponent } from '../withdrawal-modal/withdrawal-modal.component';

/**
 * Pantalla 2: Estado de Caja en Tiempo Real
 * Sprint 14 - Gestión de Caja
 */
@Component({
  selector: 'app-cash-status',
  standalone: true,
  imports: [CommonModule, RouterLink, IncomeModalComponent, ExpenseModalComponent, WithdrawalModalComponent],
  templateUrl: './cash-status.component.html',
  styleUrl: './cash-status.component.css'
})
export class CashStatusComponent implements OnInit, OnDestroy {

  summary: CashSummary | null = null;
  isLoading = true;

  showIncomeModal    = false;
  showExpenseModal   = false;
  showWithdrawalModal = false;

  private destroy$ = new Subject<void>();

  readonly movementLabels = MOVEMENT_TYPE_LABELS;
  readonly paymentLabels  = PAYMENT_METHOD_LABELS;

  constructor(
    private cashService: CashRegisterService,
    private alertService: AlertService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const session = this.cashService.getActiveSession();
    if (!session) {
      this.alertService.warning('No hay caja abierta. Por favor abra una caja primero.');
      this.router.navigate(['/cash-register']);
      return;
    }

    this.cashService.getCashStatusPolling(session.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          if (res.success && res.data) {
            this.summary = res.data;
          }
          this.isLoading = false;
        },
        error: () => { this.isLoading = false; }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get sessionId(): number {
    return this.cashService.getActiveSession()?.id ?? 0;
  }

  get elapsedTime(): string {
    if (!this.summary?.session.openedAt) return '--';
    const openedAt = new Date(this.summary.session.openedAt);
    const diffMs   = Date.now() - openedAt.getTime();
    const hours    = Math.floor(diffMs / 3600000);
    const minutes  = Math.floor((diffMs % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  }

  getMovementIcon(type: string): string {
    const icons: Record<string, string> = {
      sale:       'bi-cart-check',
      income:     'bi-arrow-down-circle',
      expense:    'bi-arrow-up-circle',
      withdrawal: 'bi-safe2',
      opening:    'bi-unlock'
    };
    return icons[type] || 'bi-circle';
  }

  getMovementClass(type: string): string {
    const classes: Record<string, string> = {
      sale:       'movement-sale',
      income:     'movement-income',
      expense:    'movement-expense',
      withdrawal: 'movement-withdrawal',
      opening:    'movement-opening'
    };
    return classes[type] || '';
  }

  onModalClose(): void {
    this.showIncomeModal     = false;
    this.showExpenseModal    = false;
    this.showWithdrawalModal = false;
    // Refrescar estado
    const session = this.cashService.getActiveSession();
    if (session) {
      this.cashService.getCashStatus(session.id).subscribe(res => {
        if (res.success && res.data) this.summary = res.data;
      });
    }
  }

  goToClose(): void {
    this.router.navigate(['/cash-register/close']);
  }
}
