import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { interval, Subject, switchMap, takeUntil } from 'rxjs';

import { PosService } from '../../services/pos.service';
import { PosSale, PosTodaySaleSummary } from '../../models/pos.model';
import { AuthService } from '../../../../core/services/auth.service';
import { AlertService } from '../../../../core/services/alert.service';
import { VoidSaleModalComponent } from '../void-sale-modal/void-sale-modal.component';

@Component({
  selector: 'app-sales-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DatePipe, VoidSaleModalComponent],
  templateUrl: './sales-history.component.html',
  styleUrl: './sales-history.component.css'
})
export class SalesHistoryComponent implements OnInit, OnDestroy {
  sales: PosTodaySaleSummary[] = [];
  loading = false;

  onlyMyShift = true;
  paymentFilter = '';
  selectedCashierId: number | null = null;

  totalSold = 0;
  transactions = 0;
  averageTicket = 0;
  mostUsedPayment = 'N/D';

  selectedSale: PosSale | null = null;
  showVoidModal = false;

  private destroy$ = new Subject<void>();

  constructor(
    private posService: PosService,
    private authService: AuthService,
    private alertService: AlertService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSales();

    interval(60000)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.posService.listTodaySales(this.buildFilters()))
      )
      .subscribe({
        next: (res) => {
          this.sales = res.data || [];
          this.applyPaymentFilter();
          this.computeSummary();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  buildFilters(): { cashierId?: number } {
    const currentUser = this.authService.getCurrentUser();
    const filters: { cashierId?: number } = {};

    if (this.onlyMyShift && currentUser?.id) {
      filters.cashierId = currentUser.id;
    } else if (this.selectedCashierId) {
      filters.cashierId = this.selectedCashierId;
    }

    return filters;
  }

  loadSales(): void {
    this.loading = true;
    this.posService.listTodaySales(this.buildFilters()).subscribe({
      next: (res) => {
        this.sales = res.data || [];
        this.applyPaymentFilter();
        this.computeSummary();
        this.loading = false;
      },
      error: (err) => {
        this.alertService.error(err?.error?.message || 'No se pudo cargar historial de ventas');
        this.loading = false;
      }
    });
  }

  applyPaymentFilter(): void {
    if (!this.paymentFilter) return;
    this.sales = this.sales.filter(s => s.paymentMethod === this.paymentFilter);
  }

  computeSummary(): void {
    const completed = this.sales.filter(s => s.status === 'completed');
    this.totalSold = Number(completed.reduce((acc, s) => acc + Number(s.totalAmount), 0).toFixed(2));
    this.transactions = completed.length;
    this.averageTicket = this.transactions ? Number((this.totalSold / this.transactions).toFixed(2)) : 0;

    const counter = new Map<string, number>();
    completed.forEach(s => counter.set(s.paymentMethod, (counter.get(s.paymentMethod) || 0) + 1));
    let winner = 'N/D';
    let max = 0;
    counter.forEach((v, k) => {
      if (v > max) {
        max = v;
        winner = k;
      }
    });
    this.mostUsedPayment = winner;
  }

  refresh(): void {
    this.loadSales();
  }

  viewDetail(id: number): void {
    this.router.navigate(['/pos/ticket', id]);
  }

  reprint(id: number): void {
    this.router.navigate(['/pos/ticket', id]);
  }

  requestVoid(id: number): void {
    this.posService.getSaleById(id).subscribe({
      next: (res) => {
        this.selectedSale = res.data || null;
        this.showVoidModal = true;
      },
      error: (err) => {
        this.alertService.error(err?.error?.message || 'No se pudo cargar venta');
      }
    });
  }

  confirmVoid(event: { reason: string }): void {
    if (!this.selectedSale) return;

    this.posService.voidSale(this.selectedSale.id, event.reason).subscribe({
      next: () => {
        this.alertService.success('Venta anulada exitosamente');
        this.showVoidModal = false;
        this.selectedSale = null;
        this.loadSales();
      },
      error: (err) => {
        this.alertService.error(err?.error?.message || 'No se pudo anular la venta');
      }
    });
  }

  cancelVoid(): void {
    this.showVoidModal = false;
    this.selectedSale = null;
  }
}
