import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { ExpenseService } from '../../services/expense.service';
import { AlertService } from '../../../../core/services/alert.service';
import { ExpenseByCategoryItem } from '../../models/expense.model';

// Chart.js via CDN (referenced from index.html)
declare var Chart: any;

@Component({
  selector: 'app-expense-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './expense-report.component.html',
  styleUrls: ['./expense-report.component.css']
})
export class ExpenseReportComponent implements OnInit, AfterViewInit, OnDestroy {

  items: ExpenseByCategoryItem[] = [];
  loading = false;
  selectedPeriod = 'current';
  startDate = '';
  endDate = '';

  chartColors = [
    '#dc3545', '#0d6efd', '#198754', '#ffc107', '#0dcaf0',
    '#6f42c1', '#fd7e14', '#20c997', '#d63384', '#6610f2'
  ];

  private chart: any;

  get grandTotal(): number {
    return this.items.reduce((s, i) => s + i.total, 0);
  }

  get topItem(): ExpenseByCategoryItem | undefined {
    return this.items[0];
  }

  get avgPerCategory(): number {
    return this.items.length ? this.grandTotal / this.items.length : 0;
  }

  constructor(
    private expenseService: ExpenseService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.setCurrentMonth();
    this.loadData();
  }

  ngAfterViewInit(): void {
    // Chart will be rendered after data loads
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private setCurrentMonth(): void {
    const r = this.expenseService.getCurrentMonthRange();
    this.startDate = r.startDate;
    this.endDate = r.endDate;
  }

  onPeriodChange(): void {
    const now = new Date();
    switch (this.selectedPeriod) {
      case 'current': {
        const r = this.expenseService.getCurrentMonthRange();
        this.startDate = r.startDate; this.endDate = r.endDate;
        break;
      }
      case 'prev': {
        const r = this.expenseService.getPreviousMonthRange();
        this.startDate = r.startDate; this.endDate = r.endDate;
        break;
      }
      case 'q3': {
        const s = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        const e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        this.startDate = s.toISOString().split('T')[0];
        this.endDate = e.toISOString().split('T')[0];
        break;
      }
      case 'year': {
        this.startDate = `${now.getFullYear()}-01-01`;
        this.endDate = `${now.getFullYear()}-12-31`;
        break;
      }
    }
    if (this.selectedPeriod !== 'custom') this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.expenseService.getExpensesByCategory(this.startDate, this.endDate).subscribe({
      next: data => {
        this.items = data.filter(i => i.total > 0).sort((a, b) => b.total - a.total);
        this.loading = false;
        setTimeout(() => this.renderChart(), 100);
      },
      error: () => {
        this.loading = false;
        this.alertService.error('Error al cargar reporte');
      }
    });
  }

  private renderChart(): void {
    const canvas = document.getElementById('expenseChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.chart) {
      this.chart.destroy();
    }

    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js no disponible. Agrega el script en index.html');
      return;
    }

    this.chart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: this.items.map(i => i.category?.name || ''),
        datasets: [{
          data: this.items.map(i => i.total),
          backgroundColor: this.chartColors.slice(0, this.items.length),
          borderWidth: 2,
          borderColor: '#fff',
          hoverBorderWidth: 3
        }]
      },
      options: {
        responsive: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx: any) => {
                const val = ctx.parsed;
                const pct = this.items[ctx.dataIndex]?.percentage || 0;
                return ` $${val.toLocaleString('es-SV', { minimumFractionDigits: 2 })} (${pct}%)`;
              }
            }
          }
        },
        cutout: '60%',
        animation: { animateScale: true }
      }
    });
  }

  // ── Acciones ──────────────────────────────────────────────────────────────

  print(): void { window.print(); }

  exportData(): void {
    this.alertService.info('Exportación disponible próximamente');
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  formatCurrency(v: number): string {
    return new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(v || 0);
  }
}
