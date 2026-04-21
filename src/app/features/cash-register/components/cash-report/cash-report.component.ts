import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { CashRegisterService } from '../../services/cash-register.service';
import { AlertService } from '../../../../core/services/alert.service';
import { CashCloseReport, PAYMENT_METHOD_LABELS, DENOMINATION_ALL } from '../../models/cash-register.model';

/**
 * Pantalla 7: Reporte de Cierre de Caja
 * Sprint 14 - Gestión de Caja
 */
@Component({
  selector: 'app-cash-report',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cash-report.component.html',
  styleUrl: './cash-report.component.css'
})
export class CashReportComponent implements OnInit {

  report: CashCloseReport | null = null;
  isLoading = true;
  sessionId = 0;

  readonly paymentLabels = PAYMENT_METHOD_LABELS;

  constructor(
    private route: ActivatedRoute,
    private cashService: CashRegisterService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.sessionId = Number(this.route.snapshot.paramMap.get('id') ?? 0);
    this.loadReport();
  }

  private loadReport(): void {
    this.cashService.getSessionDetail(this.sessionId).subscribe({
      next: res => {
        if (res.success && res.data) this.report = res.data;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  get differenceClass(): string {
    if (!this.report) return '';
    if (this.report.differenceType === 'surplus')  return 'surplus';
    if (this.report.differenceType === 'shortage') return 'shortage';
    return 'exact';
  }

  get differenceLabel(): string {
    if (!this.report) return '--';
    const d = this.report.difference;
    if (d === 0)  return 'Exacto';
    if (d > 0)    return `+$${d.toFixed(2)} (Sobrante)`;
    return `-$${Math.abs(d).toFixed(2)} (Faltante)`;
  }

  printReport(): void {
    window.print();
  }

  downloadPdf(): void {
    this.cashService.generateReport(this.sessionId).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href    = url;
        a.download = `reporte-caja-${this.sessionId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.alertService.error('Error al generar el PDF')
    });
  }
}
