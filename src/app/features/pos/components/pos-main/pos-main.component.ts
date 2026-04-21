import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { ProductService } from '../../../products/services/product.service';
import { CategoryService } from '../../../categories/services/category.service';
import { Product } from '../../../products/models/product.model';
import { Category } from '../../../categories/models/category.model';
import { PosService } from '../../services/pos.service';
import { PosCart, PosCustomer, PosPaymentMethod, PosSale } from '../../models/pos.model';
import { DiscountModalComponent } from '../discount-modal/discount-modal.component';
import { FinalizeSaleModalComponent } from '../finalize-sale-modal/finalize-sale-modal.component';
import { AuthService } from '../../../../core/services/auth.service';
import { AlertService } from '../../../../core/services/alert.service';

@Component({
  selector: 'app-pos-main',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DiscountModalComponent, FinalizeSaleModalComponent],
  templateUrl: './pos-main.component.html',
  styleUrl: './pos-main.component.css'
})
export class PosMainComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  popularProducts: Product[] = [];
  categories: Category[] = [];

  selectedCategoryId: number | null = null;
  searchTerm = '';
  private search$ = new Subject<string>();

  cart: PosCart | null = null;
  sessionId: number | null = null;

  customerTerm = '';
  customerResults: PosCustomer[] = [];
  selectedCustomer: PosCustomer | null = null;

  showDiscountModal = false;
  showFinalizeModal = false;

  lastSale: PosSale | null = null;
  showSuccessModal = false;

  loadingProducts = false;
  loadingCart = false;

  private destroy$ = new Subject<void>();

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private posService: PosService,
    private authService: AuthService,
    private alertService: AlertService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // DEBUG: Verificar autenticación y token
    const user = this.authService.getCurrentUser();
    console.log('POS-MAIN: Usuario actual:', user);

    this.sessionId = Number(localStorage.getItem('pos_current_session') || 0) || null;

    this.search$
      .pipe(debounceTime(250), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => this.loadProducts());

    this.loadCategories();
    this.loadProducts();
    this.loadPopularProducts();

    if (this.sessionId) {
      this.refreshTotals();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get cashierName(): string {
    return this.authService.getCurrentUser()?.fullName || 'Cajero';
  }

  get subtotal(): number {
    return this.cart?.totals?.subtotal || 0;
  }

  get discountAmount(): number {
    return this.cart?.totals?.discountAmount || 0;
  }

  get iva(): number {
    return this.cart?.totals?.iva || 0;
  }

  get total(): number {
    return this.cart?.totals?.total || 0;
  }

  get canCharge(): boolean {
    return !!this.cart && this.cart.items.length > 0;
  }

  loadCategories(): void {
    this.categoryService.getCategories('active').subscribe({
      next: (res) => {
        this.categories = res.data || [];
      }
    });
  }

  loadProducts(): void {
    this.loadingProducts = true;
    this.productService.getProducts({
      page: 1,
      limit: 60,
      search: this.searchTerm || undefined,
      categoryId: this.selectedCategoryId || undefined,
      isActive: true
    }).subscribe({
      next: (res) => {
        this.products = res.data?.products || [];
        this.loadingProducts = false;
      },
      error: () => {
        this.loadingProducts = false;
      }
    });
  }

  loadPopularProducts(): void {
    this.posService.getPopularProducts({ period: 'day', limit: 8 }).subscribe({
      next: (res) => {
        const ids = (res.data || []).map(item => item.product.id);
        if (!ids.length) {
          this.popularProducts = [];
          return;
        }

        this.productService.getProducts({ page: 1, limit: 100, isActive: true }).subscribe({
          next: (productsRes) => {
            const all = productsRes.data?.products || [];
            this.popularProducts = ids
              .map(id => all.find(p => p.id === id))
              .filter((p): p is Product => !!p);
          }
        });
      },
      error: () => {
        this.popularProducts = [];
      }
    });
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.search$.next(value);
  }

  setCategory(categoryId: number | null): void {
    this.selectedCategoryId = categoryId;
    this.loadProducts();
  }

  addProduct(product: Product): void {
    console.log('POS-MAIN: Agregando producto:', product.name, '| SessionId:', this.sessionId);

    this.loadingCart = true;
    this.posService.addToCart({
      sessionId: this.sessionId,
      productId: product.id,
      quantity: 1,
      customerId: this.selectedCustomer?.id || undefined
    }).subscribe({
      next: (res) => {
        console.log('POS-MAIN: Producto agregado exitosamente');
        this.cart = res.data || null;
        this.sessionId = this.cart?.sessionId || null;
        if (this.sessionId) {
          localStorage.setItem('pos_current_session', String(this.sessionId));
        }
        this.loadingCart = false;
      },
      error: (err) => {
        console.error('POS-MAIN: Error agregando producto', err);
        this.alertService.warning(err?.error?.message || 'No se pudo agregar producto');
        this.loadingCart = false;
      }
    });
  }

  increaseQty(item: any): void {
    if (!this.sessionId) return;
    this.posService.updateCartQuantity(this.sessionId, item.productId, item.quantity + 1).subscribe({
      next: (res) => this.cart = res.data || null,
      error: (err) => this.alertService.warning(err?.error?.message || 'No se pudo actualizar cantidad')
    });
  }

  decreaseQty(item: any): void {
    if (!this.sessionId) return;
    const nextQty = Math.max(0, item.quantity - 1);
    this.posService.updateCartQuantity(this.sessionId, item.productId, nextQty).subscribe({
      next: (res) => this.cart = res.data || null,
      error: (err) => this.alertService.warning(err?.error?.message || 'No se pudo actualizar cantidad')
    });
  }

  removeItem(item: any): void {
    if (!this.sessionId) return;
    this.posService.removeFromCart(this.sessionId, item.productId).subscribe({
      next: (res) => this.cart = res.data || null,
      error: (err) => this.alertService.warning(err?.error?.message || 'No se pudo remover producto')
    });
  }

  refreshTotals(): void {
    if (!this.sessionId) return;
    this.posService.calculateTotal(this.sessionId).subscribe({
      next: (res) => this.cart = res.data || null
    });
  }

  searchCustomers(): void {
    const term = this.customerTerm.trim();
    if (!term) {
      this.customerResults = [];
      return;
    }

    this.posService.searchCustomer(term).subscribe({
      next: (res) => this.customerResults = res.data || []
    });
  }

  selectCustomer(c: PosCustomer): void {
    this.selectedCustomer = c;
    this.customerTerm = c.fullName;
    this.customerResults = [];
  }

  createQuickCustomer(): void {
    const name = this.customerTerm.trim();
    if (!name) {
      this.alertService.warning('Escribe el nombre del cliente para crear registro rápido');
      return;
    }

    this.posService.quickCreateCustomer({ fullName: name }).subscribe({
      next: (res) => {
        const customer = res.data as PosCustomer;
        this.selectedCustomer = customer;
        this.customerTerm = customer.fullName;
        this.customerResults = [];
        this.alertService.success('Cliente creado rápidamente');
      },
      error: (err) => this.alertService.error(err?.error?.message || 'No se pudo crear cliente')
    });
  }

  openDiscountModal(): void {
    if (!this.cart || this.cart.items.length === 0) return;
    this.showDiscountModal = true;
  }

  applyDiscount(event: { discountType: 'percentage' | 'fixed'; value: number; reason: string; observations?: string }): void {
    if (!this.sessionId) return;
    this.posService.applyDiscount(this.sessionId, {
      discountType: event.discountType,
      value: event.value,
      reason: [event.reason, event.observations].filter(Boolean).join(' - ')
    }).subscribe({
      next: (res) => {
        this.cart = res.data || null;
        this.showDiscountModal = false;
      },
      error: (err) => this.alertService.error(err?.error?.message || 'No se pudo aplicar descuento')
    });
  }

  cancelDiscountModal(): void {
    this.showDiscountModal = false;
  }

  openFinalizeModal(): void {
    if (!this.canCharge) {
      this.alertService.warning('No hay productos en el carrito');
      return;
    }
    this.showFinalizeModal = true;
  }

  confirmFinalize(event: { paymentMethod: PosPaymentMethod; amountReceived?: number; payloadExtras?: Record<string, any> }): void {
    if (!this.sessionId) return;

    if (event.paymentMethod === 'credito') {
      this.alertService.warning('La opción crédito requiere integración con módulo de créditos en un siguiente ajuste.');
      return;
    }

    this.posService.processPayment(this.sessionId, {
      paymentMethod: event.paymentMethod,
      amountReceived: event.amountReceived,
      customerId: this.selectedCustomer?.id || undefined,
      notes: event.payloadExtras ? JSON.stringify(event.payloadExtras) : undefined
    }).subscribe({
      next: (res) => {
        this.lastSale = res.data || null;
        this.showFinalizeModal = false;
        this.showSuccessModal = true;
        this.playSuccessSound();
        this.clearCurrentSale(false);
      },
      error: (err) => {
        this.alertService.error(err?.error?.message || 'No se pudo procesar el pago');
      }
    });
  }

  cancelFinalize(): void {
    this.showFinalizeModal = false;
  }

  clearCurrentSale(showMessage = true): void {
    this.cart = null;
    this.sessionId = null;
    this.selectedCustomer = null;
    this.customerTerm = '';
    this.customerResults = [];
    localStorage.removeItem('pos_current_session');
    if (showMessage) {
      this.alertService.success('Carrito limpiado');
    }
  }

  suspendSale(): void {
    if (!this.sessionId) {
      this.alertService.warning('No hay sesión activa para suspender');
      return;
    }

    localStorage.setItem('pos_suspended_session', String(this.sessionId));
    this.clearCurrentSale(false);
    this.alertService.success('Venta suspendida correctamente');
  }

  restoreSuspended(): void {
    const suspended = Number(localStorage.getItem('pos_suspended_session') || 0);
    if (!suspended) {
      this.alertService.warning('No hay ventas suspendidas');
      return;
    }

    this.sessionId = suspended;
    localStorage.setItem('pos_current_session', String(suspended));
    localStorage.removeItem('pos_suspended_session');
    this.refreshTotals();
    this.alertService.success('Venta suspendida restaurada');
  }

  goScanner(): void {
    this.router.navigate(['/barcodes']);
  }

  openTicket(): void {
    if (!this.lastSale?.id) return;
    this.router.navigate(['/pos/ticket', this.lastSale.id]);
  }

  closeSuccess(): void {
    this.showSuccessModal = false;
  }

  private playSuccessSound(): void {
    const ctx = new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = 880;
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.value = 0.08;
    o.start();
    o.stop(ctx.currentTime + 0.12);
  }
}
