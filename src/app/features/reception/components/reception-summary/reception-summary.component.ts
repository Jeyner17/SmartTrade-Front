import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { ReceptionService } from '../../services/reception.service';
import { AlertService } from '../../../../core/services/alert.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Reception, ReceptionDetail, ReceptionDiscrepancy } from '../../models/reception.model';

@Component({
  selector: 'app-reception-summary',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './reception-summary.component.html',
  styleUrl: './reception-summary.component.css'
})
export class ReceptionSummaryComponent implements OnInit, OnDestroy {
  receptionId = 0;
  reception: Reception | null = null;
  discrepancies: ReceptionDiscrepancy[] = [];

  updateInventory = true;
  notes = '';
  isSaving = false;
  isLoading = false;
  currentUsername = 'Usuario';

  private readonly destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private receptionService: ReceptionService,
    private alertService: AlertService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUsername = this.authService.getCurrentUser()?.username || 'Usuario';
    this.receptionId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.receptionId) {
      this.router.navigate(['/reception']);
      return;
    }

    this.loadSummary();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSummary(): void {
    this.isLoading = true;

    this.receptionService.getById(this.receptionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.reception = response.data ?? null;
          this.notes = this.reception?.observations || '';
          this.isLoading = false;
          this.loadDiscrepancies();
        },
        error: (error: any) => {
          this.alertService.error(error?.error?.message || 'No se pudo cargar el resumen de recepción');
          this.isLoading = false;
        }
      });
  }

  get isConfirmed(): boolean {
    return !!this.reception?.confirmedAt;
  }

  loadDiscrepancies(): void {
    this.receptionService.listDiscrepancies({ receptionId: this.receptionId, limit: 100, page: 1 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.discrepancies = response.data?.discrepancies ?? [];
        }
      });
  }

  confirmAndUpdate(): void {
    if (!this.reception) {
      return;
    }

    if (this.isConfirmed) {
      this.alertService.warning('Esta recepción ya fue confirmada. Solo puedes revisar los detalles.');
      return;
    }

    this.isSaving = true;

    this.receptionService.confirm(this.reception.id, { observations: this.notes?.trim() || null })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.alertService.success('Recepción confirmada correctamente');
          this.isSaving = false;
          this.downloadReceipt();
          this.router.navigate(['/reception']);
        },
        error: (error: any) => {
          this.alertService.error(error?.error?.message || 'No se pudo confirmar la recepción');
          this.isSaving = false;
        }
      });
  }

  goBackToReview(): void {
    if (!this.reception) {
      return;
    }

    if (this.isConfirmed) {
      this.alertService.info('La recepción ya está confirmada. Solo está disponible la vista de resumen.');
      return;
    }

    this.router.navigate(['/reception/process'], {
      queryParams: {
        receptionId: this.reception.id,
        orderId: this.reception.purchaseOrderId
      }
    });
  }

  cancelReception(): void {
    this.router.navigate(['/reception']);
  }

  downloadReceipt(): void {
    if (!this.reception) {
      return;
    }

    const lines: string[] = [
      `Comprobante de Recepción: ${this.reception.receptionNumber}`,
      `Orden: ${this.reception.purchaseOrder?.orderNumber || this.reception.purchaseOrderId}`,
      `Proveedor: ${this.reception.purchaseOrder?.supplier?.tradeName || 'N/D'}`,
      `Fecha de recepción: ${this.reception.receptionDate}`,
      `Recibido por: ${this.getCurrentUserName()}`,
      '',
      'Detalle de productos:',
      ...(this.reception.details || []).map(detail =>
        `- ${detail.product?.name || `Producto #${detail.productId}`}: Esperado ${detail.quantityExpected}, Recibido ${detail.quantityReceived}`
      ),
      '',
      `Total esperado: ${this.getTotalExpected()}`,
      `Total recibido: ${this.getTotalReceived()}`,
      `Discrepancias: ${this.discrepancies.length}`
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comprobante-${this.reception.receptionNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  getTotalExpected(): number {
    return (this.reception?.details || []).reduce((acc, item) => acc + (item.quantityExpected || 0), 0);
  }

  getTotalReceived(): number {
    return (this.reception?.details || []).reduce((acc, item) => acc + (item.quantityReceived || 0), 0);
  }

  getLineStatus(detail: ReceptionDetail): string {
    if (detail.quantityReceived === detail.quantityExpected) {
      return 'Completo';
    }

    if (detail.quantityReceived > detail.quantityExpected) {
      return 'Sobrante';
    }

    if (detail.quantityReceived === 0) {
      return 'Pendiente';
    }

    return 'Faltante';
  }

  getLineStatusClass(detail: ReceptionDetail): string {
    if (detail.quantityReceived === detail.quantityExpected) {
      return 'text-success fw-semibold';
    }

    return 'text-danger fw-semibold';
  }

  private getCurrentUserName(): string {
    const user = this.authService.getCurrentUser();
    if (!user) {
      return 'Sistema';
    }

    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return fullName || user.username || 'Usuario';
  }
}
