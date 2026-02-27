import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { ProductService } from '../../services/product.service';
import { AlertService } from '../../../../core/services/alert.service';
import { AuthService } from '../../../../core/services/auth.service';
import { AUTH_CONSTANTS } from '../../../../core/constants/auth.constants';
import { Product, PriceHistory } from '../../models/product.model';

const { MODULES, ACTIONS } = AUTH_CONSTANTS;

/**
 * Componente de Detalle de Producto
 * Sprint 6 - Gestión de Productos
 */
@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe, ReactiveFormsModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit, OnDestroy {

  product: Product | null = null;
  productId = 0;
  isLoading = false;

  canEdit = false;

  // Modal cambio de precio
  showPriceModal = false;
  priceForm!: FormGroup;
  isSavingPrice = false;

  private destroy$ = new Subject<void>();

  constructor(
    private route:          ActivatedRoute,
    private productService: ProductService,
    private alertService:   AlertService,
    private authService:    AuthService,
    private fb:             FormBuilder
  ) {}

  ngOnInit(): void {
    this.canEdit    = this.authService.hasPermission(MODULES.PRODUCTS, ACTIONS.EDIT);
    this.productId  = parseInt(this.route.snapshot.paramMap.get('id') ?? '0');
    this.buildPriceForm();
    this.loadProduct();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================
  // CARGA
  // ============================================

  loadProduct(): void {
    this.isLoading = true;
    this.productService.getProductById(this.productId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.product  = res.data ?? null;
          this.isLoading = false;
        },
        error: (err) => {
          this.alertService.error(err.message || 'Error al cargar el producto');
          this.isLoading = false;
        }
      });
  }

  // ============================================
  // HELPERS
  // ============================================

  getImageSrc(): string {
    if (!this.product?.imageUrl) return '';
    return 'http://localhost:3000' + this.product.imageUrl;
  }

  getMargin(): string {
    if (!this.product?.cost || this.product.cost <= 0) return '—';
    const m = ((this.product.price - this.product.cost) / this.product.cost * 100).toFixed(1);
    return m + '%';
  }

  getPriceDiff(entry: PriceHistory): string {
    const diff = ((entry.newPrice - entry.previousPrice) / entry.previousPrice * 100).toFixed(1);
    return (Number(diff) >= 0 ? '+' : '') + diff + '%';
  }

  isDiffPositive(entry: PriceHistory): boolean {
    return entry.newPrice >= entry.previousPrice;
  }

  // ============================================
  // MODAL CAMBIO DE PRECIO
  // ============================================

  private buildPriceForm(): void {
    this.priceForm = this.fb.group({
      newPrice: [null, [Validators.required, Validators.min(0.01)]],
      reason:   ['']
    });
  }

  openPriceModal(): void {
    this.priceForm.reset({ newPrice: this.product?.price ?? null, reason: '' });
    this.showPriceModal = true;
  }

  closePriceModal(): void {
    this.showPriceModal = false;
  }

  getNewPriceDiff(): string {
    const newPrice = parseFloat(this.priceForm.get('newPrice')?.value);
    const current  = this.product?.price ?? 0;
    if (!newPrice || !current) return '';
    const diff = ((newPrice - current) / current * 100).toFixed(1);
    return (Number(diff) >= 0 ? '+' : '') + diff + '%';
  }

  isNewPriceHigher(): boolean {
    const newPrice = parseFloat(this.priceForm.get('newPrice')?.value);
    return newPrice >= (this.product?.price ?? 0);
  }

  submitPriceChange(): void {
    if (this.priceForm.invalid) {
      this.priceForm.markAllAsTouched();
      return;
    }

    const { newPrice, reason } = this.priceForm.value;
    this.isSavingPrice = true;

    this.productService.updatePrice(this.productId, {
      newPrice: parseFloat(newPrice),
      reason:   reason?.trim() || undefined
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.alertService.success('Precio actualizado exitosamente');
          this.closePriceModal();
          this.loadProduct(); // recargar para ver historial actualizado
          this.isSavingPrice = false;
        },
        error: (err) => {
          this.alertService.error(err.message || 'Error al actualizar precio');
          this.isSavingPrice = false;
        }
      });
  }
}
