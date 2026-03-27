import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { ReceptionService } from '../../services/reception.service';
import { SupplierService } from '../../../suppliers/services/supplier.service';
import { AlertService } from '../../../../core/services/alert.service';
import { Router } from '@angular/router';
import { ReceptionDiscrepancy, DISCREPANCY_TYPE_LABELS } from '../../models/reception.model';
import { Supplier } from '../../../suppliers/models/supplier.model';

@Component({
  selector: 'app-discrepancy-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './discrepancy-history.component.html',
  styleUrl: './discrepancy-history.component.css'
})
export class DiscrepancyHistoryComponent implements OnInit, OnDestroy {
  discrepancies: ReceptionDiscrepancy[] = [];
  filtered: ReceptionDiscrepancy[] = [];
  suppliers: Supplier[] = [];

  selectedSupplierId: number | null = null;
  selectedType = '';
  startDate = '';
  endDate = '';

  isLoading = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private receptionService: ReceptionService,
    private supplierService: SupplierService,
    private alertService: AlertService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSuppliers();
    this.loadDiscrepancies();
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

  loadDiscrepancies(): void {
    this.isLoading = true;

    this.receptionService.listDiscrepancies({ page: 1, limit: 100, type: this.selectedType || undefined })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.discrepancies = response.data?.discrepancies ?? [];
          this.applyClientFilters();
          this.isLoading = false;
        },
        error: (error: any) => {
          this.alertService.error(error?.error?.message || 'No se pudo cargar el historial de discrepancias');
          this.isLoading = false;
        }
      });
  }

  onFiltersChange(): void {
    this.applyClientFilters();
  }

  clearFilters(): void {
    this.selectedSupplierId = null;
    this.selectedType = '';
    this.startDate = '';
    this.endDate = '';
    this.loadDiscrepancies();
  }

  goBack(): void {
    this.router.navigate(['/reception']);
  }

  getStatusClass(discrepancy: ReceptionDiscrepancy): string {
    if (discrepancy.resolved) {
      return 'bg-success';
    }

    return 'bg-warning text-dark';
  }

  getStatusLabel(discrepancy: ReceptionDiscrepancy): string {
    return discrepancy.resolved ? 'Resuelto' : 'Pendiente';
  }

  getTypeLabel(type: string): string {
    return DISCREPANCY_TYPE_LABELS[type as keyof typeof DISCREPANCY_TYPE_LABELS] || type;
  }

  getTotalMonth(): number {
    const month = new Date().getMonth();
    const year = new Date().getFullYear();
    return this.filtered.filter(item => {
      const date = new Date(item.createdAt);
      return date.getMonth() === month && date.getFullYear() === year;
    }).length;
  }

  getMostCommonType(): string {
    if (!this.filtered.length) {
      return 'N/D';
    }

    const counter = new Map<string, number>();
    this.filtered.forEach(item => {
      counter.set(item.type, (counter.get(item.type) || 0) + 1);
    });

    let type = '';
    let max = 0;
    counter.forEach((value, key) => {
      if (value > max) {
        max = value;
        type = key;
      }
    });

    return this.getTypeLabel(type);
  }

  getSupplierMostIssues(): string {
    if (!this.filtered.length) {
      return 'N/D';
    }

    const counter = new Map<string, number>();
    this.filtered.forEach(item => {
      const supplier = item.reception?.purchaseOrder?.supplier?.tradeName || 'Sin proveedor';
      counter.set(supplier, (counter.get(supplier) || 0) + 1);
    });

    let supplier = 'N/D';
    let max = 0;
    counter.forEach((value, key) => {
      if (value > max) {
        max = value;
        supplier = key;
      }
    });

    return supplier;
  }

  exportExcel(): void {
    const headers = ['Fecha', 'Recepción', 'Proveedor', 'Producto', 'Tipo', 'Cantidad afectada', 'Estado'];
    const rows = this.filtered.map(item => [
      new Date(item.createdAt).toLocaleDateString(),
      item.reception?.receptionNumber || '',
      item.reception?.purchaseOrder?.supplier?.tradeName || '',
      item.product?.name || `Producto #${item.productId}`,
      this.getTypeLabel(item.type),
      String(Math.abs((item.quantityExpected || 0) - (item.quantityReceived || 0))),
      this.getStatusLabel(item)
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(col => `"${String(col).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historial-discrepancias-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  generateReport(): void {
    const report = [
      'Reporte de Discrepancias',
      `Total mes actual: ${this.getTotalMonth()}`,
      `Proveedor con más discrepancias: ${this.getSupplierMostIssues()}`,
      `Tipo más común: ${this.getMostCommonType()}`
    ].join('\n');

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-discrepancias-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private applyClientFilters(): void {
    this.filtered = this.discrepancies.filter(item => {
      const supplierId = item.reception?.purchaseOrder?.supplier?.id;
      const created = new Date(item.createdAt);

      if (this.selectedSupplierId && supplierId !== this.selectedSupplierId) {
        return false;
      }

      if (this.selectedType && item.type !== this.selectedType) {
        return false;
      }

      if (this.startDate && created < new Date(`${this.startDate}T00:00:00`)) {
        return false;
      }

      if (this.endDate && created > new Date(`${this.endDate}T23:59:59`)) {
        return false;
      }

      return true;
    });
  }
}
