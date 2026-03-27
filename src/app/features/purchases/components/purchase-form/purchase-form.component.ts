import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { PurchaseService } from '../../services/purchase.service';
import { ProductService } from '../../../products/services/product.service';
import { SupplierService } from '../../../suppliers/services/supplier.service';
import { AlertService } from '../../../../core/services/alert.service';
import { Product } from '../../../products/models/product.model';
import { Supplier } from '../../../suppliers/models/supplier.model';
import { PurchaseOrder, PurchaseStatus } from '../../models/purchase.model';

interface OrderProductLine {
  productId: number;
  name: string;
  sku?: string;
  quantity: number;
  unitCost: number;
}

@Component({
  selector: 'app-purchase-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CurrencyPipe],
  templateUrl: './purchase-form.component.html',
  styleUrl: './purchase-form.component.css'
})
export class PurchaseFormComponent implements OnInit, OnDestroy {
  readonly isEditMode: boolean;

  orderId: number | null = null;
  orderNumber = '';
  currentStatus: PurchaseStatus = 'pendiente';

  suppliers: Supplier[] = [];
  selectedSupplierId: number | null = null;
  expectedDeliveryDate = '';
  observations = '';

  productSearchTerm = '';
  productResults: Product[] = [];
  selectedProductId: number | null = null;
  selectedProductQty = 1;
  selectedProductCost = 0;

  lines: OrderProductLine[] = [];

  applyIva = false;
  ivaPercent = 15;

  isLoading = false;
  isSaving = false;

  private readonly destroy$ = new Subject<void>();
  private readonly searchSubject = new Subject<string>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private purchaseService: PurchaseService,
    private supplierService: SupplierService,
    private productService: ProductService,
    private alertService: AlertService
  ) {
    this.isEditMode = this.route.snapshot.url.some(segment => segment.path === 'edit');
  }

  ngOnInit(): void {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(term => {
        this.searchProducts(term);
      });

    this.loadSuppliers();

    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (this.isEditMode && Number.isFinite(id) && id > 0) {
      this.orderId = id;
      this.loadOrder(id);
    }
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

  loadOrder(id: number): void {
    this.isLoading = true;

    this.purchaseService.getOrderById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const order = response.data as PurchaseOrder;
          this.orderNumber = order.orderNumber;
          this.currentStatus = order.status;

          if (order.status !== 'pendiente') {
            this.alertService.warning('Solo se puede editar una orden en estado pendiente');
            this.router.navigate(['/purchases', id]);
            return;
          }

          this.selectedSupplierId = order.supplierId;
          this.expectedDeliveryDate = order.expectedDeliveryDate ? order.expectedDeliveryDate.slice(0, 10) : '';
          this.observations = order.notes ?? '';
          this.applyIva = (order.ivaPercent ?? 0) > 0;
          this.ivaPercent = order.ivaPercent ?? 0;
          this.lines = (order.details ?? []).map(detail => ({
            productId: detail.productId,
            name: detail.product?.name || `Producto #${detail.productId}`,
            sku: detail.product?.sku,
            quantity: detail.quantityOrdered,
            unitCost: Number(detail.unitCost)
          }));

          this.isLoading = false;
        },
        error: (error: any) => {
          this.alertService.error(error?.error?.message || 'Error al cargar la orden');
          this.isLoading = false;
        }
      });
  }

  get selectedSupplier(): Supplier | undefined {
    return this.suppliers.find(supplier => supplier.id === this.selectedSupplierId);
  }

  onSearchProduct(term: string): void {
    if (!this.selectedSupplierId) {
      this.alertService.warning('Seleccione primero un proveedor');
      this.productResults = [];
      return;
    }

    this.searchSubject.next(term);
  }

  searchProducts(term: string): void {
    const cleanTerm = term.trim();

    if (!cleanTerm) {
      this.productResults = [];
      return;
    }

    this.productService.getProducts({ search: cleanTerm, limit: 20, isActive: true })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.productResults = response.data?.products ?? [];
        }
      });
  }

  selectProduct(product: Product): void {
    this.selectedProductId = product.id;
    this.selectedProductCost = Number(product.cost ?? product.price ?? 0);
  }

  addProduct(): void {
    if (!this.selectedProductId || this.selectedProductQty <= 0 || this.selectedProductCost < 0) {
      this.alertService.warning('Complete la selección del producto, cantidad y costo unitario');
      return;
    }

    const selected = this.productResults.find(product => product.id === this.selectedProductId);
    if (!selected) {
      this.alertService.warning('Seleccione un producto válido');
      return;
    }

    const existing = this.lines.find(line => line.productId === selected.id);
    if (existing) {
      existing.quantity += this.selectedProductQty;
      existing.unitCost = this.selectedProductCost;
    } else {
      this.lines.push({
        productId: selected.id,
        name: selected.name,
        sku: selected.sku,
        quantity: this.selectedProductQty,
        unitCost: this.selectedProductCost
      });
    }

    this.selectedProductId = null;
    this.selectedProductQty = 1;
    this.selectedProductCost = 0;
    this.productSearchTerm = '';
    this.productResults = [];
  }

  removeLine(index: number): void {
    this.lines.splice(index, 1);
  }

  getLineSubtotal(line: OrderProductLine): number {
    return Number((line.quantity * line.unitCost).toFixed(2));
  }

  get subtotal(): number {
    return Number(this.lines.reduce((acc, line) => acc + this.getLineSubtotal(line), 0).toFixed(2));
  }

  get ivaValue(): number {
    if (!this.applyIva) {
      return 0;
    }

    return Number((this.subtotal * (this.ivaPercent / 100)).toFixed(2));
  }

  get total(): number {
    return Number((this.subtotal + this.ivaValue).toFixed(2));
  }

  save(asConfirmed: boolean): void {
    if (!this.selectedSupplierId) {
      this.alertService.warning('Debe seleccionar un proveedor');
      return;
    }

    if (this.lines.length === 0) {
      this.alertService.warning('Debe agregar al menos un producto');
      return;
    }

    const payload = {
      supplierId: this.selectedSupplierId,
      expectedDeliveryDate: this.expectedDeliveryDate || null,
      observations: this.observations || '',
      applyIva: this.applyIva,
      ivaPercent: this.applyIva ? this.ivaPercent : 0,
      products: this.lines.map(line => ({
        productId: line.productId,
        quantity: Number(line.quantity),
        unitCost: Number(line.unitCost)
      }))
    };

    this.isSaving = true;

    if (!this.isEditMode) {
      this.purchaseService.createOrder(payload)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            const createdOrder = response.data as PurchaseOrder;

            if (asConfirmed) {
              this.purchaseService.changeStatus(createdOrder.id, { newStatus: 'confirmada' })
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                  next: () => {
                    this.alertService.success('Orden creada y confirmada exitosamente');
                    this.router.navigate(['/purchases', createdOrder.id]);
                  },
                  error: () => {
                    this.alertService.warning('Orden creada, pero no se pudo confirmar automáticamente');
                    this.router.navigate(['/purchases', createdOrder.id]);
                  }
                });
            } else {
              this.alertService.success('Orden creada como pendiente');
              this.router.navigate(['/purchases', createdOrder.id]);
            }

            this.isSaving = false;
          },
          error: (error: any) => {
            this.alertService.error(error?.error?.message || 'Error al crear la orden');
            this.isSaving = false;
          }
        });

      return;
    }

    if (!this.orderId) {
      this.alertService.error('ID de orden inválido');
      this.isSaving = false;
      return;
    }

    this.purchaseService.updateOrder(this.orderId, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          if (asConfirmed) {
            this.purchaseService.changeStatus(this.orderId as number, { newStatus: 'confirmada' })
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: () => {
                  this.alertService.success('Orden actualizada y confirmada exitosamente');
                  this.router.navigate(['/purchases', this.orderId]);
                },
                error: () => {
                  this.alertService.warning('Orden actualizada, pero no se pudo confirmar automáticamente');
                  this.router.navigate(['/purchases', this.orderId]);
                }
              });
          } else {
            this.alertService.success('Orden actualizada como pendiente');
            this.router.navigate(['/purchases', this.orderId]);
          }

          this.isSaving = false;
        },
        error: (error: any) => {
          this.alertService.error(error?.error?.message || 'Error al actualizar la orden');
          this.isSaving = false;
        }
      });
  }
}

