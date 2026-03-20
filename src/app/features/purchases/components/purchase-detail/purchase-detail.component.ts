import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { PurchaseService } from '../../services/purchase.service';
import { AlertService } from '../../../../core/services/alert.service';
import { PurchaseOrder, PurchaseStatus, PURCHASE_STATUS_BADGE, PURCHASE_STATUS_LABELS } from '../../models/purchase.model';
import { PurchaseReceiveModalComponent } from '../purchase-receive-modal/purchase-receive-modal.component';
import { PurchaseCancelModalComponent } from '../purchase-cancel-modal/purchase-cancel-modal.component';

@Component({
  selector: 'app-purchase-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CurrencyPipe,
    DatePipe,
    PurchaseReceiveModalComponent,
    PurchaseCancelModalComponent
  ],
  templateUrl: './purchase-detail.component.html',
  styleUrl: './purchase-detail.component.css'
})
export class PurchaseDetailComponent implements OnInit, OnDestroy {
  orderId = 0;
  order: PurchaseOrder | null = null;

  isLoading = false;
  isSaving = false;

  showReceiveModal = false;
  showCancelModal = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private purchaseService: PurchaseService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.orderId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.orderId) {
      this.router.navigate(['/purchases']);
      return;
    }

    this.loadOrder();

    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const action = params.get('action');

      if (action === 'receive') {
        this.showReceiveModal = true;
      }

      if (action === 'cancel') {
        this.showCancelModal = true;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadOrder(): void {
    this.isLoading = true;

    this.purchaseService.getOrderById(this.orderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.order = response.data ?? null;
          this.isLoading = false;
        },
        error: (error: any) => {
          this.alertService.error(error?.error?.message || 'Error al cargar detalle de la orden');
          this.isLoading = false;
        }
      });
  }

  getStatusLabel(status: PurchaseStatus): string {
    return PURCHASE_STATUS_LABELS[status];
  }

  getStatusBadge(status: PurchaseStatus): string {
    return PURCHASE_STATUS_BADGE[status];
  }

  canEdit(): boolean {
    return this.order?.status === 'pendiente';
  }

  canConfirm(): boolean {
    return this.order?.status === 'pendiente';
  }

  canReceive(): boolean {
    return this.order?.status === 'confirmada';
  }

  canCancel(): boolean {
    return this.order?.status === 'pendiente' || this.order?.status === 'confirmada';
  }

  isReceived(): boolean {
    return this.order?.status === 'recibida';
  }

  confirmOrder(): void {
    if (!this.order) {
      return;
    }

    this.isSaving = true;

    this.purchaseService.changeStatus(this.order.id, { newStatus: 'confirmada' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.alertService.success('Orden confirmada exitosamente');
          this.isSaving = false;
          this.loadOrder();
        },
        error: (error: any) => {
          this.alertService.error(error?.error?.message || 'No se pudo confirmar la orden');
          this.isSaving = false;
        }
      });
  }

  onReceiveConfirmed(payload: { observations: string; products: Array<{ productId: number; quantityReceived: number }> }): void {
    if (!this.order) {
      return;
    }

    this.isSaving = true;

    this.purchaseService.receiveOrder(this.order.id, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.alertService.success('Recepción registrada correctamente');
          this.showReceiveModal = false;
          this.isSaving = false;
          this.router.navigate([], { queryParams: { action: null }, queryParamsHandling: 'merge' });
          this.loadOrder();
        },
        error: (error: any) => {
          this.alertService.error(error?.error?.message || 'No se pudo registrar la recepción');
          this.isSaving = false;
        }
      });
  }

  onCancelConfirmed(payload: { reason: string }): void {
    if (!this.order) {
      return;
    }

    this.isSaving = true;

    this.purchaseService.cancelOrder(this.order.id, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.alertService.success('Orden cancelada exitosamente');
          this.showCancelModal = false;
          this.isSaving = false;
          this.router.navigate([], { queryParams: { action: null }, queryParamsHandling: 'merge' });
          this.loadOrder();
        },
        error: (error: any) => {
          this.alertService.error(error?.error?.message || 'No se pudo cancelar la orden');
          this.isSaving = false;
        }
      });
  }

  closeReceiveModal(): void {
    this.showReceiveModal = false;
    this.router.navigate([], { queryParams: { action: null }, queryParamsHandling: 'merge' });
  }

  closeCancelModal(): void {
    this.showCancelModal = false;
    this.router.navigate([], { queryParams: { action: null }, queryParamsHandling: 'merge' });
  }

  printOrder(): void {
    window.print();
  }

  goToInventoryLog(): void {
    const productId = this.order?.details?.[0]?.productId;
    if (!productId) {
      this.alertService.warning('No hay productos para abrir el registro de inventario');
      return;
    }

    this.router.navigate(['/inventory/movements', productId]);
  }

  getChangedByName(history: { changedByUser?: { firstName?: string; lastName?: string; username: string } }): string {
    const firstName = history.changedByUser?.firstName || '';
    const lastName = history.changedByUser?.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();

    return fullName || history.changedByUser?.username || 'Sistema';
  }
}
