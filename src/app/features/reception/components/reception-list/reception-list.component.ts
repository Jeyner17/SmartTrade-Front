import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { ReceptionService } from '../../services/reception.service';
import { SupplierService } from '../../../suppliers/services/supplier.service';
import { AlertService } from '../../../../core/services/alert.service';
import { Reception, ReceptionFilters, ReceptionStatus } from '../../models/reception.model';
import { Supplier } from '../../../suppliers/models/supplier.model';

type VisualStatusFilter = '' | 'completa' | 'parcial' | 'discrepancias';

@Component({
  selector: 'app-reception-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './reception-list.component.html',
  styleUrl: './reception-list.component.css'
})
export class ReceptionListComponent implements OnInit, OnDestroy {
  receptions: Reception[] = [];
  suppliers: Supplier[] = [];

  isLoading = false;
  currentPage = 1;
  readonly PAGE_SIZE = 10;

  selectedSupplierId: number | null = null;
  selectedVisualStatus: VisualStatusFilter = '';
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

  private readonly destroy$ = new Subject<void>();

  constructor(
    private receptionService: ReceptionService,
    private supplierService: SupplierService,
    private alertService: AlertService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSuppliers();
    this.loadReceptions();
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

  loadReceptions(): void {
    this.isLoading = true;

    const filters: ReceptionFilters = {
      page: this.currentPage,
      limit: this.PAGE_SIZE
    };

    if (this.selectedSupplierId) {
      filters.supplierId = this.selectedSupplierId;
    }

    if (this.startDate) {
      filters.startDate = this.startDate;
    }

    if (this.endDate) {
      filters.endDate = this.endDate;
    }

    const mappedStatus = this.mapVisualStatusToBackend(this.selectedVisualStatus);
    if (mappedStatus) {
      filters.status = mappedStatus;
    }

    this.receptionService.list(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          let list = response.data?.receptions ?? [];

          if (this.selectedVisualStatus === 'discrepancias') {
            list = list.filter(item => !!item.hasDiscrepancies);
          }

          this.receptions = list;
          this.pagination = response.data?.pagination ?? null;
          this.isLoading = false;
        },
        error: (error: any) => {
          this.alertService.error(error?.error?.message || 'No se pudo cargar la lista de recepciones');
          this.isLoading = false;
        }
      });
  }

  onFiltersChange(): void {
    this.currentPage = 1;
    this.loadReceptions();
  }

  clearFilters(): void {
    this.selectedSupplierId = null;
    this.selectedVisualStatus = '';
    this.startDate = '';
    this.endDate = '';
    this.currentPage = 1;
    this.loadReceptions();
  }

  onPageChange(page: number): void {
    if (page < 1 || (this.pagination && page > this.pagination.pages)) {
      return;
    }

    this.currentPage = page;
    this.loadReceptions();
  }

  getPages(): number[] {
    if (!this.pagination) {
      return [];
    }

    const pages: number[] = [];
    const totalPages = this.pagination.pages;

    for (let page = Math.max(1, this.currentPage - 2); page <= Math.min(totalPages, this.currentPage + 2); page++) {
      pages.push(page);
    }

    return pages;
  }

  goToNewReception(): void {
    this.router.navigate(['/reception/process']);
  }

  goToSummary(reception: Reception): void {
    this.router.navigate(['/reception', reception.id, 'summary']);
  }

  goToHistory(): void {
    this.router.navigate(['/reception/discrepancies/history']);
  }

  getStateIconClass(reception: Reception): string {
    if (reception.status === 'completa' && !reception.hasDiscrepancies) {
      return 'bi bi-check-circle-fill text-success';
    }

    if (reception.hasDiscrepancies && this.getDiscrepancySeverity(reception) === 'high') {
      return 'bi bi-circle-fill text-danger';
    }

    if (reception.hasDiscrepancies) {
      return 'bi bi-exclamation-triangle-fill text-warning';
    }

    return 'bi bi-hourglass-split text-warning';
  }

  getDiscrepancyLabel(reception: Reception): string {
    return reception.hasDiscrepancies ? 'Sí' : 'No';
  }

  getProductsProgress(reception: Reception): string {
    return `${reception.itemsReceived || 0} / ${reception.itemsExpected || 0}`;
  }

  private mapVisualStatusToBackend(status: VisualStatusFilter): ReceptionStatus | null {
    if (status === 'completa') {
      return 'completa';
    }

    if (status === 'parcial') {
      return 'parcial';
    }

    return null;
  }

  private getDiscrepancySeverity(reception: Reception): 'low' | 'high' {
    const expected = reception.itemsExpected || 0;
    const received = reception.itemsReceived || 0;
    if (!expected) {
      return 'low';
    }

    const ratio = Math.abs(expected - received) / expected;
    return ratio >= 0.2 ? 'high' : 'low';
  }
}
