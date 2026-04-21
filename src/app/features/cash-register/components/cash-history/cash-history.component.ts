import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { CashRegisterService } from '../../services/cash-register.service';
import { AlertService } from '../../../../core/services/alert.service';
import { CashHistoryItem, CashHistoryFilters } from '../../models/cash-register.model';

/**
 * Pantalla 8: Historial de Cierres de Caja
 * Sprint 14 - Gestión de Caja
 */
@Component({
  selector: 'app-cash-history',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './cash-history.component.html',
  styleUrl: './cash-history.component.css'
})
export class CashHistoryComponent implements OnInit {

  sessions: CashHistoryItem[] = [];
  isLoading = false;
  filterForm: FormGroup;

  readonly cashNumbers = [1, 2, 3, 4, 5];

  // Estadísticas
  get totalSales(): number {
    return this.sessions.reduce((sum, s) => sum + (s.totalSales ?? 0), 0);
  }
  get avgSales(): number {
    return this.sessions.length ? this.totalSales / this.sessions.length : 0;
  }
  get sessionsWithDiff(): number {
    return this.sessions.filter(s => s.differenceType !== 'exact').length;
  }
  get topCashier(): string {
    if (!this.sessions.length) return '—';
    const map = new Map<string, number>();
    this.sessions.forEach(s => map.set(s.cashierName, (map.get(s.cashierName) ?? 0) + s.totalSales));
    let best = '' , max = 0;
    map.forEach((v, k) => { if (v > max) { max = v; best = k; } });
    return best || '—';
  }

  constructor(
    private fb: FormBuilder,
    private cashService: CashRegisterService,
    private alertService: AlertService
  ) {
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

    this.filterForm = this.fb.group({
      startDate:       [thirtyDaysAgo],
      endDate:         [today],
      cashNumber:      [''],
      status:          [''],
      withDifferences: [false]
    });
  }

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.isLoading = true;
    const v = this.filterForm.value;
    const filters: CashHistoryFilters = {
      startDate:       v.startDate || undefined,
      endDate:         v.endDate   || undefined,
      cashNumber:      v.cashNumber ? +v.cashNumber : undefined,
      status:          v.status || undefined,
      withDifferences: v.withDifferences || undefined
    };

    this.cashService.getHistory(filters).subscribe({
      next: res => {
        this.sessions = res.data ?? [];
        this.isLoading = false;
      },
      error: () => {
        this.alertService.error('Error al cargar historial de caja');
        this.isLoading = false;
      }
    });
  }

  getDiffClass(item: CashHistoryItem): string {
    if (item.differenceType === 'surplus')  return 'surplus';
    if (item.differenceType === 'shortage') return 'shortage';
    return '';
  }

  getDiffLabel(item: CashHistoryItem): string {
    if (item.differenceType === 'exact')    return 'Exacto';
    if (item.differenceType === 'surplus')  return `+$${item.difference.toFixed(2)}`;
    return `-$${Math.abs(item.difference).toFixed(2)}`;
  }

  formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  }

  exportExcel(): void {
    this.alertService.info('Exportación en desarrollo');
  }

  getStatusLabel(status: 'OPEN' | 'COUNTED' | 'CLOSED'): string {
    if (status === 'OPEN') return 'Abierta';
    if (status === 'COUNTED') return 'Contada';
    return 'Cerrada';
  }
}
