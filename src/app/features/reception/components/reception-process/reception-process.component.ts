import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { ReceptionService } from '../../services/reception.service';
import { AlertService } from '../../../../core/services/alert.service';
import { Reception, ReceptionDetail } from '../../models/reception.model';

@Component({
  selector: 'app-reception-process',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, RouterLink],
  templateUrl: './reception-process.component.html',
  styleUrl: './reception-process.component.css'
})
export class ReceptionProcessComponent implements OnInit, OnDestroy {
  @ViewChild('barcodeInput') barcodeInput?: ElementRef<HTMLInputElement>;

  confirmedOrders: any[] = [];
  selectedOrderId: number | null = null;
  selectedOrder: any | null = null;

  reception: Reception | null = null;
  barcode = '';
  scannedProductName = '';
  scanWaitingText = 'Esperando escaneo...';

  isLoadingOrders = false;
  isLoadingReception = false;
  isScanning = false;
  isPaused = false;

  readonly receptionDate = new Date().toISOString().slice(0, 10);

  private readonly destroy$ = new Subject<void>();

  constructor(
    private receptionService: ReceptionService,
    private alertService: AlertService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadConfirmedOrders();

    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const receptionId = Number(params.get('receptionId'));
      const orderId = Number(params.get('orderId'));

      if (receptionId) {
        this.loadReception(receptionId);
      }

      if (orderId) {
        this.selectedOrderId = orderId;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadConfirmedOrders(): void {
    this.isLoadingOrders = true;

    this.receptionService.listConfirmedPurchaseOrders({ page: 1, limit: 100 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.confirmedOrders = response.data?.orders ?? [];
          this.isLoadingOrders = false;

          if (this.selectedOrderId) {
            this.selectedOrder = this.confirmedOrders.find(order => order.id === this.selectedOrderId) ?? null;
          }
        },
        error: () => {
          this.alertService.error('No se pudieron cargar las órdenes pendientes de recibir');
          this.isLoadingOrders = false;
        }
      });
  }

  onOrderSelected(): void {
    this.selectedOrder = this.confirmedOrders.find(order => order.id === this.selectedOrderId) ?? null;
    if (!this.selectedOrderId || this.reception?.purchaseOrderId === this.selectedOrderId) {
      return;
    }

    this.createReception();
  }

  createReception(): void {
    if (!this.selectedOrderId) {
      this.alertService.warning('Selecciona una orden de compra primero');
      return;
    }

    this.isLoadingReception = true;

    this.receptionService.create({
      purchaseOrderId: this.selectedOrderId,
      receptionDate: this.receptionDate,
      observations: 'Recepción iniciada desde pantalla de escaneo'
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.reception = response.data ?? null;
          this.isLoadingReception = false;
          this.isPaused = false;
          this.alertService.success('Recepción iniciada correctamente');
          this.focusInput();
        },
        error: (error: any) => {
          this.alertService.error(error?.error?.message || 'No se pudo iniciar la recepción');
          this.isLoadingReception = false;
        }
      });
  }

  onScanSubmit(): void {
    if (this.reception?.status === 'cancelada' || !!this.reception?.confirmedAt) {
      this.alertService.warning('Esta recepción ya no permite escaneos porque está cerrada');
      return;
    }

    if (this.isPaused) {
      this.alertService.warning('La recepción está en pausa. Reanúdala para continuar');
      return;
    }

    if (!this.selectedOrderId || !this.reception || !this.barcode.trim()) {
      return;
    }

    this.isScanning = true;
    const barcodeValue = this.barcode.trim();

    this.receptionService.verifyBarcode({ purchaseOrderId: this.selectedOrderId, barcode: barcodeValue })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (verifyResponse) => {
          const verifyData = verifyResponse.data ?? {};
          const productId = verifyData?.product?.id ?? verifyData?.id ?? verifyData?.productId;
          const productName = verifyData?.product?.name ?? verifyData?.name ?? verifyData?.productName;

          if (!productId) {
            this.handleFailedScan('Producto no válido para esta orden');
            return;
          }

          this.receptionService.registerScan(this.reception!.id, { productId, quantityScanned: 1 })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (scanResponse) => {
                this.scannedProductName = productName || `Producto #${productId}`;
                this.scanWaitingText = `Escaneado: ${this.scannedProductName}`;
                this.playSuccessSound();

                const updatedReception = scanResponse.data?.reception;
                if (updatedReception?.id) {
                  this.loadReception(updatedReception.id, false);
                } else {
                  this.loadReception(this.reception!.id, false);
                }

                this.barcode = '';
                this.isScanning = false;
                this.focusInput();
              },
              error: (error: any) => {
                this.handleFailedScan(error?.error?.message || 'No se pudo registrar el escaneo');
              }
            });
        },
        error: (error: any) => {
          this.handleFailedScan(error?.error?.message || 'El producto no pertenece a la orden seleccionada');
        }
      });
  }

  adjustQuantity(detail: ReceptionDetail): void {
    if (!this.reception) {
      return;
    }

    const input = window.prompt(`Ajuste de cantidad para ${detail.product?.name || 'producto'} (+ suma / - resta):`, '1');
    const quantity = Number(input);

    if (!Number.isInteger(quantity) || quantity === 0) {
      this.alertService.warning('Ingresa un número entero distinto de 0 (ej: 1 o -1)');
      return;
    }

    this.receptionService.registerScan(this.reception.id, { productId: detail.productId, quantityScanned: quantity })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.alertService.success('Cantidad ajustada correctamente');
          this.loadReception(this.reception!.id);
        },
        error: (error: any) => {
          this.alertService.error(error?.error?.message || 'No se pudo ajustar la cantidad');
        }
      });
  }

  openDiscrepancy(detail: ReceptionDetail): void {
    if (!this.reception) {
      return;
    }

    this.router.navigate(['/reception/discrepancies/new'], {
      queryParams: {
        receptionId: this.reception.id,
        productId: detail.productId,
        expected: detail.quantityExpected,
        received: detail.quantityReceived,
        orderId: this.reception.purchaseOrderId
      }
    });
  }

  confirmReception(): void {
    if (!this.reception) {
      return;
    }

    this.receptionService.confirm(this.reception.id, {
      observations: 'Recepción confirmada desde proceso de escaneo'
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.alertService.success('Recepción confirmada y stock actualizado');
          this.router.navigate(['/reception', this.reception!.id, 'summary']);
        },
        error: (error: any) => {
          this.alertService.error(error?.error?.message || 'No se pudo confirmar la recepción');
        }
      });
  }

  togglePause(): void {
    this.isPaused = !this.isPaused;
    this.scanWaitingText = this.isPaused ? 'Recepción en pausa' : 'Esperando escaneo...';
    if (!this.isPaused) {
      this.focusInput();
    }
  }

  cancelReception(): void {
    this.router.navigate(['/reception']);
  }

  goToSummary(): void {
    if (!this.reception) {
      return;
    }

    this.router.navigate(['/reception', this.reception.id, 'summary']);
  }

  getProgressPercent(): number {
    if (!this.reception || !this.reception.details || this.reception.details.length === 0) {
      return 0;
    }

    const expected = this.reception.details.reduce((acc, item) => acc + (item.quantityExpected || 0), 0);
    const received = this.reception.details.reduce((acc, item) => acc + (item.quantityReceived || 0), 0);

    if (!expected) {
      return 0;
    }

    return Math.min(100, Math.round((received / expected) * 100));
  }

  getScannedCounter(): string {
    if (!this.reception || !this.reception.details) {
      return '0 de 0 productos escaneados';
    }

    const scanned = this.reception.details.filter(item => (item.quantityReceived || 0) > 0).length;
    return `${scanned} de ${this.reception.details.length} productos escaneados`;
  }

  getDiscrepanciesCount(): number {
    if (!this.reception || !this.reception.details) {
      return 0;
    }

    return this.reception.details.filter(item => (item.quantityReceived || 0) !== (item.quantityExpected || 0)).length;
  }

  getDetailProgress(detail: ReceptionDetail): number {
    if (!detail.quantityExpected) {
      return 0;
    }

    return Math.min(100, Math.round((detail.quantityReceived / detail.quantityExpected) * 100));
  }

  getDetailStatusClass(detail: ReceptionDetail): string {
    if (detail.quantityReceived === detail.quantityExpected) {
      return 'bg-success';
    }

    if (detail.quantityReceived > detail.quantityExpected) {
      return 'bg-danger';
    }

    if (detail.quantityReceived > 0) {
      return 'bg-warning text-dark';
    }

    return 'bg-secondary';
  }

  getDetailStatusLabel(detail: ReceptionDetail): string {
    if (detail.quantityReceived === detail.quantityExpected) {
      return 'Completo';
    }

    if (detail.quantityReceived > detail.quantityExpected) {
      return 'Discrepancia';
    }

    if (detail.quantityReceived > 0) {
      return 'En proceso';
    }

    return 'Pendiente';
  }

  private loadReception(receptionId: number, showToast = false): void {
    this.isLoadingReception = true;

    this.receptionService.getById(receptionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.reception = response.data ?? null;
          this.selectedOrderId = this.reception?.purchaseOrderId ?? this.selectedOrderId;
          this.selectedOrder = this.confirmedOrders.find(order => order.id === this.selectedOrderId) ?? this.selectedOrder;
          this.isLoadingReception = false;
          if (showToast) {
            this.alertService.success('Datos de recepción actualizados');
          }
          this.focusInput();
        },
        error: () => {
          this.isLoadingReception = false;
        }
      });
  }

  private handleFailedScan(message: string): void {
    this.isScanning = false;
    this.scanWaitingText = 'Producto no válido para esta orden';
    this.alertService.warning(message);
    this.focusInput();
  }

  private focusInput(): void {
    setTimeout(() => this.barcodeInput?.nativeElement?.focus(), 50);
  }

  private playSuccessSound(): void {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.12);
    } catch {
      // Silencioso si el navegador bloquea audio automático
    }
  }
}
