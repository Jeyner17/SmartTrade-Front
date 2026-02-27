import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { CategoryService } from '../../services/category.service';
import { AlertService } from '../../../../core/services/alert.service';
import { Category, CategoryProductsResponse } from '../../models/category.model';

/**
 * Componente de Productos por Categoría
 * Sprint 5 - Gestión de Categorías
 */
@Component({
  selector: 'app-category-products',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './category-products.component.html',
  styleUrl: './category-products.component.css'
})
export class CategoryProductsComponent implements OnInit, OnDestroy {

  categoryId = 0;
  category: Category | null = null;
  products: any[] = [];
  total = 0;
  isLoading = false;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private categoryService: CategoryService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.categoryId = parseInt(this.route.snapshot.paramMap.get('id') ?? '0');
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    this.isLoading = true;

    // Cargar datos de la categoría y sus productos en paralelo
    this.categoryService.getCategoryById(this.categoryId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.category = res.data ?? null;
        },
        error: (err) => {
          this.alertService.error(err.message || 'Error al cargar la categoría');
        }
      });

    this.categoryService.getCategoryProducts(this.categoryId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const data = res.data as CategoryProductsResponse;
          this.products = data?.products ?? [];
          this.total    = data?.total    ?? 0;
          this.isLoading = false;
        },
        error: (err) => {
          this.alertService.error(err.message || 'Error al cargar productos');
          this.isLoading = false;
        }
      });
  }

  getLevelLabel(level: number): string {
    if (level === 0) return 'Categoría raíz';
    return `Nivel ${level}`;
  }
}
