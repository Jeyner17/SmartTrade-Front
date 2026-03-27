import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { ReceptionService } from '../../services/reception.service';
import { AlertService } from '../../../../core/services/alert.service';
import { DiscrepancyType, DISCREPANCY_TYPE_LABELS } from '../../models/reception.model';

@Component({
  selector: 'app-discrepancy-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './discrepancy-form.component.html',
  styleUrl: './discrepancy-form.component.css'
})
export class DiscrepancyFormComponent implements OnInit, OnDestroy {
  receptionId = 0;
  orderId = 0;

  productId = 0;
  quantityExpected = 0;
  quantityReceived = 0;

  type: DiscrepancyType = 'faltante';
  discrepancyQuantity = 0;
  description = '';
  actionToTake = 'Aceptar discrepancia';
  photoFileName = '';

  isSaving = false;

  readonly typeOptions: Array<{ value: DiscrepancyType; label: string }> = [
    { value: 'faltante', label: DISCREPANCY_TYPE_LABELS.faltante },
    { value: 'sobrante', label: DISCREPANCY_TYPE_LABELS.sobrante },
    { value: 'dañado', label: DISCREPANCY_TYPE_LABELS.dañado },
    { value: 'otro', label: 'Producto incorrecto / Otro' }
  ];

  private readonly destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private receptionService: ReceptionService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.receptionId = Number(params.get('receptionId'));
      this.orderId = Number(params.get('orderId'));
      this.productId = Number(params.get('productId'));
      this.quantityExpected = Number(params.get('expected')) || 0;
      this.quantityReceived = Number(params.get('received')) || 0;

      this.discrepancyQuantity = Math.abs(this.quantityExpected - this.quantityReceived);

      if (!this.receptionId || !this.productId) {
        this.alertService.warning('No hay datos suficientes para registrar discrepancia');
        this.router.navigate(['/reception']);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.photoFileName = file?.name || '';
  }

  register(): void {
    if (!this.receptionId || !this.productId) {
      return;
    }

    this.isSaving = true;

    const observations = [
      this.description,
      `Acción sugerida: ${this.actionToTake}`,
      this.photoFileName ? `Foto: ${this.photoFileName}` : ''
    ].filter(Boolean).join(' | ');

    this.receptionService.reportDiscrepancy(this.receptionId, {
      productId: this.productId,
      quantityExpected: this.quantityExpected,
      quantityReceived: this.quantityReceived,
      type: this.type,
      observations
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.alertService.success('Discrepancia registrada correctamente');
          this.isSaving = false;
          this.continueReception();
        },
        error: (error: any) => {
          this.alertService.error(error?.error?.message || 'No se pudo registrar la discrepancia');
          this.isSaving = false;
        }
      });
  }

  ignore(): void {
    this.continueReception();
  }

  private continueReception(): void {
    this.router.navigate(['/reception/process'], {
      queryParams: {
        receptionId: this.receptionId,
        orderId: this.orderId || undefined
      }
    });
  }
}
