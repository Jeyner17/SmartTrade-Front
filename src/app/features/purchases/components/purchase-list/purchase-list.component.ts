import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { PurchaseService } from '../../services/purchase.service';
import { SupplierService } from '../../../suppliers/services/supplier.service';
import { AlertService } from '../../../../core/services/alert.service';
import { AuthService } from '../../../../core/services/auth.service';
import { AUTH_CONSTANTS } from '../../../../core/constants/auth.constants';
import {
  PurchaseListItem,
  PurchaseStatus,
  PurchaseFilters,
  PURCHASE_STATUS_LABELS,
  PURCHASE_STATUS_BADGE
} from '../../models/purchase.model';
import { Supplier } from '../../../suppliers/models/supplier.model';

const { MODULES, ACTIONS } = AUTH_CONSTANTS;

@Component({
  selector: 'app-purchase-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './purchase-list.component.html',
  styleUrl: './purchase-list.component.css'
})
export class PurchaseListComponent implements OnInit, OnDestroy {
  orders: PurchaseListItem[] = [];
  suppliers: Supplier[] = [];
  isLoading = false;

  currentPage = 1;
  readonly PAGE_SIZE = 10;

  searchTerm = '';
  selectedSupplierId: number | null = null;
  selectedStatus: PurchaseStatus | '' = '';
  startDate = '';
  endDate = '';

  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null = null;

  canCreate = false;
  canEdit = false;

  private readonly searchSubject = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  constructor(
    private purchaseService: PurchaseService,
    private supplierService: SupplierService,
    private alertService: AlertService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.canCreate = this.authService.hasPermission(MODULES.PURCHASES, ACTIONS.CREATE);
    this.canEdit = this.authService.hasPermission(MODULES.PURCHASES, ACTIONS.EDIT);

    this.searchSubject
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentPage = 1;
        this.loadOrders();
      });

    this.loadSuppliers();
    this.loadOrders();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSuppliers(): void {
    this.supplierService.getSuppliers({ limit: 100 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.suppliers = response.data?.suppliers ?? [];
        }
      });
  }

  loadOrders(): void {
    this.isLoading = true;

    const filters: PurchaseFilters = {
      page: this.currentPage,
      limit: this.PAGE_SIZE
    };

    if (this.selectedSupplierId) {
      filters.supplierId = this.selectedSupplierId;
    }

    if (this.selectedStatus) {
      filters.status = this.selectedStatus;
    }

    if (this.startDate) {
      filters.startDate = this.startDate;
    }

    if (this.endDate) {
      filters.endDate = this.endDate;
    }

    this.purchaseService.getOrders(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const allOrders = response.data?.orders ?? [];
          const term = this.searchTerm.trim().toLowerCase();

          this.orders = term
            ? allOrders.filter(order => order.orderNumber.toLowerCase().includes(term))
            : allOrders;

          this.pagination = response.data?.pagination ?? null;
          this.isLoading = false;
        },
        error: (error: any) => {
          this.alertService.error(error?.error?.message || 'Error al cargar órdenes de compra');
          this.isLoading = false;
        }
      });
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  onFiltersChange(): void {
    this.currentPage = 1;
    this.loadOrders();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedSupplierId = null;
    this.selectedStatus = '';
    this.startDate = '';
    this.endDate = '';
    this.currentPage = 1;
    this.loadOrders();
  }

  onPageChange(page: number): void {
    if (page < 1 || (this.pagination && page > this.pagination.pages)) {
      return;
    }

    this.currentPage = page;
    this.loadOrders();
  }

  getPages(): number[] {
    if (!this.pagination) {
      return [];
    }

    const pages: number[] = [];
    const totalPages = this.pagination.pages;
    const current = this.currentPage;

    for (let page = Math.max(1, current - 2); page <= Math.min(totalPages, current + 2); page++) {
      pages.push(page);
    }

    return pages;
  }

  canEditOrder(order: PurchaseListItem): boolean {
    return this.canEdit && (order.status === 'pendiente' || order.status === 'confirmada');
  }

  canReceiveOrder(order: PurchaseListItem): boolean {
    return order.status === 'confirmada';
  }

  getStatusLabel(status: PurchaseStatus): string {
    return PURCHASE_STATUS_LABELS[status];
  }

  getStatusBadge(status: PurchaseStatus): string {
    return PURCHASE_STATUS_BADGE[status];
  }

  goToReceive(order: PurchaseListItem): void {
    this.router.navigate(['/purchases', order.id], { queryParams: { action: 'receive' } });
  }

  goToCancel(order: PurchaseListItem): void {
    this.router.navigate(['/purchases', order.id], { queryParams: { action: 'cancel' } });
  }
}

