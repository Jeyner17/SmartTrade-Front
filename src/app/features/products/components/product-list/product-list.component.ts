import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../../categories/services/category.service';
import { AuthService } from '../../../../core/services/auth.service';
import { AlertService } from '../../../../core/services/alert.service';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { AUTH_CONSTANTS } from '../../../../core/constants/auth.constants';
import { Product, ProductFilters } from '../../models/product.model';
import { CategoryFlat } from '../../../categories/models/category.model';

const { MODULES, ACTIONS } = AUTH_CONSTANTS;

/**
 * Componente de Lista/Catálogo de Productos
 * Sprint 6 - Gestión de Productos
 * Soporta vista en grilla y tabla con filtros y paginación.
 */
@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CurrencyPipe],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css'
})
export class ProductListComponent implements OnInit, OnDestroy {

  products: Product[] = [];
  pagination: any = null;
  isLoading = false;

  // Vista
  viewMode: 'table' | 'grid' = 'table';

  // Filtros
  searchTerm = '';
  selectedCategoryId: number | null = null;
  statusFilter: 'all' | 'active' | 'inactive' = 'all';

  // Categorías para el selector de filtro
  categories: CategoryFlat[] = [];

  // Permisos
  canCreate = false;
  canEdit   = false;
  canDelete = false;

  // Búsqueda reactiva
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  // Paginación
  currentPage = 1;
  readonly PAGE_SIZE = 12;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private authService: AuthService,
    private alertService: AlertService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.canCreate = this.authService.hasPermission(MODULES.PRODUCTS, ACTIONS.CREATE);
    this.canEdit   = this.authService.hasPermission(MODULES.PRODUCTS, ACTIONS.EDIT);
    this.canDelete = this.authService.hasPermission(MODULES.PRODUCTS, ACTIONS.DELETE);

    // Debounce de búsqueda
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage = 1;
      this.loadProducts();
    });

    this.loadCategories();
    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================
  // CARGA DE DATOS
  // ============================================

  loadProducts(): void {
    this.isLoading = true;

    const filters: ProductFilters = {
      page:  this.currentPage,
      limit: this.PAGE_SIZE
    };

    if (this.searchTerm.trim())          filters.search     = this.searchTerm.trim();
    if (this.selectedCategoryId)         filters.categoryId = this.selectedCategoryId;
    if (this.statusFilter === 'active')  filters.isActive   = true;
    if (this.statusFilter === 'inactive') filters.isActive  = false;

    this.productService.getProducts(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.products   = res.data?.products  ?? [];
          this.pagination = res.data?.pagination ?? null;
          this.isLoading  = false;
        },
        error: (err) => {
          this.alertService.error(err.message || 'Error al cargar productos');
          this.isLoading = false;
        }
      });
  }

  loadCategories(): void {
    this.categoryService.getCategories('active')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.categories = this.flattenCategoryTree(res.data ?? []);
        }
      });
  }

  private flattenCategoryTree(nodes: any[]): CategoryFlat[] {
    const result: CategoryFlat[] = [];
    const recurse = (list: any[]) => {
      for (const n of list) {
        result.push({ id: n.id, name: n.name, level: n.level, parentId: n.parentId,
                      isActive: n.isActive, productCount: n.productCount,
                      description: n.description, hasChildren: (n.children?.length > 0),
                      isExpanded: false });
        if (n.children?.length) recurse(n.children);
      }
    };
    recurse(nodes);
    return result;
  }

  // ============================================
  // FILTROS Y BÚSQUEDA
  // ============================================

  onSearch(term: string): void {
    this.searchSubject.next(term);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadProducts();
  }

  clearFilters(): void {
    this.searchTerm        = '';
    this.selectedCategoryId = null;
    this.statusFilter      = 'all';
    this.currentPage       = 1;
    this.loadProducts();
  }

  // ============================================
  // PAGINACIÓN
  // ============================================

  onPageChange(page: number): void {
    if (page < 1 || (this.pagination && page > this.pagination.pages)) return;
    this.currentPage = page;
    this.loadProducts();
  }

  getPages(): number[] {
    if (!this.pagination) return [];
    const total = this.pagination.pages;
    const cur   = this.currentPage;
    const range: number[] = [];
    const delta = 2;
    for (let i = Math.max(1, cur - delta); i <= Math.min(total, cur + delta); i++) {
      range.push(i);
    }
    return range;
  }

  // ============================================
  // ACCIONES
  // ============================================

  toggleStatus(product: Product): void {
    const action = product.isActive ? 'desactivar' : 'activar';
    this.confirmationService.confirm({
      title:       `${product.isActive ? 'Desactivar' : 'Activar'} producto`,
      message:     `¿Está seguro que desea ${action} "${product.name}"?`,
      confirmText: product.isActive ? 'Desactivar' : 'Activar',
      cancelText:  'Cancelar',
      type:        product.isActive ? 'warning' : 'info'
    }).subscribe(confirmed => {
      if (!confirmed) return;
      this.productService.toggleStatus(product.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            this.alertService.success(res.data?.message || `Producto ${action}do`);
            this.loadProducts();
          },
          error: (err) => this.alertService.error(err.message || `Error al ${action} producto`)
        });
    });
  }

  deleteProduct(product: Product): void {
    this.confirmationService.confirm({
      title:       'Eliminar producto',
      message:     `¿Está seguro que desea eliminar "${product.name}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText:  'Cancelar',
      type:        'danger'
    }).subscribe(confirmed => {
      if (!confirmed) return;
      this.productService.deleteProduct(product.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.alertService.success('Producto eliminado exitosamente');
            this.loadProducts();
          },
          error: (err) => this.alertService.error(err.message || 'Error al eliminar producto')
        });
    });
  }

  // ============================================
  // HELPERS TEMPLATE
  // ============================================

  getMargin(product: Product): string {
    if (!product.cost || product.cost <= 0) return '—';
    const margin = ((product.price - product.cost) / product.cost) * 100;
    return margin.toFixed(1) + '%';
  }

  getImageSrc(imageUrl?: string): string {
    if (!imageUrl) return '';
    return 'http://localhost:3000' + imageUrl;
  }

  hasImage(imageUrl?: string): boolean {
    return !!imageUrl;
  }

  getCategoryName(product: Product): string {
    return product.category?.name ?? '—';
  }

  trackById(_: number, item: Product): number {
    return item.id;
  }
}
