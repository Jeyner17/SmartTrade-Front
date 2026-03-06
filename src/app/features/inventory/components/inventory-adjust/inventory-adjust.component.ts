import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { InventoryService } from '../../services/inventory.service';
import { ProductService } from '../../../products/services/product.service';
import { Product } from '../../../products/models/product.model';
import { AdjustInventoryDto, REASON_LABELS, MOVEMENT_REASONS } from '../../models/inventory.model';

/**
 * Pantalla 5: Ajuste de Inventario Físico
 * Sprint 7 - Gestión de Inventario
 */
@Component({
  selector: 'app-inventory-adjust',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory-adjust.component.html',
  styleUrl: './inventory-adjust.component.css'
})
export class InventoryAdjustComponent implements OnInit {
  selectedProduct: Product | null = null;
  searchTerm = '';
  searchResults: Product[] = [];
  searching = false;

  adjustDto: AdjustInventoryDto = {
    productId: 0,
    newStock: 0,
    reason: '',
    notes: ''
  };

  difference = 0;
  loading = false;
  successMessage = '';
  errorMessage = '';

  // Razones de ajuste
  adjustReasons = [
    { value: MOVEMENT_REASONS.INVENTARIO_FISICO, label: REASON_LABELS[MOVEMENT_REASONS.INVENTARIO_FISICO] },
    { value: MOVEMENT_REASONS.PRODUCTOS_DANADOS, label: REASON_LABELS[MOVEMENT_REASONS.PRODUCTOS_DANADOS] },
    { value: MOVEMENT_REASONS.ERROR_REGISTRO, label: REASON_LABELS[MOVEMENT_REASONS.ERROR_REGISTRO] },
    { value: MOVEMENT_REASONS.ROBO, label: REASON_LABELS[MOVEMENT_REASONS.ROBO] },
    { value: MOVEMENT_REASONS.MERMA, label: REASON_LABELS[MOVEMENT_REASONS.MERMA] },
    { value: MOVEMENT_REASONS.OTRO, label: REASON_LABELS[MOVEMENT_REASONS.OTRO] }
  ];

  constructor(
    private inventoryService: InventoryService,
    private productService: ProductService,
    private router: Router
  ) {}

  ngOnInit(): void {}

  searchProducts(): void {
    if (!this.searchTerm || this.searchTerm.length < 2) {
      this.searchResults = [];
      return;
    }

    this.searching = true;
    this.productService.getProducts({ search: this.searchTerm, limit: 10 }).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.searchResults = response.data.products;
        }
        this.searching = false;
      },
      error: (err: any) => {
        console.error('Error al buscar productos:', err);
        this.searching = false;
      }
    });
  }

  selectProduct(product: Product): void {
    this.selectedProduct = product;
    this.adjustDto.productId = product.id;
    this.adjustDto.newStock = product.stock;
    this.searchTerm = product.name;
    this.searchResults = [];
    this.calculateDifference();
  }

  calculateDifference(): void {
    if (this.selectedProduct) {
      this.difference = this.adjustDto.newStock - this.selectedProduct.stock;
    }
  }

  getDifferenceClass(): string {
    if (this.difference > 0) return 'text-success';
    if (this.difference < 0) return 'text-danger';
    return 'text-muted';
  }

  getDifferenceLabel(): string {
    if (this.difference > 0) return `+${this.difference} (Sobrante)`;
    if (this.difference < 0) return `${this.difference} (Faltante)`;
    return '0 (Sin cambios)';
  }

  canSubmit(): boolean {
    return !!(
      this.selectedProduct &&
      this.adjustDto.newStock >= 0 &&
      this.adjustDto.reason &&
      this.difference !== 0
    );
  }

  adjustInventory(): void {
    if (!this.canSubmit()) return;

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.inventoryService.adjustInventory(this.adjustDto).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = `Inventario ajustado exitosamente. Stock actualizado: ${this.adjustDto.newStock}`;
          setTimeout(() => {
            this.router.navigate(['/inventory']);
          }, 2000);
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al ajustar inventario:', err);
        this.errorMessage = err.error?.message || 'Error al ajustar el inventario';
        this.loading = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/inventory']);
  }

  clearSelection(): void {
    this.selectedProduct = null;
    this.searchTerm = '';
    this.searchResults = [];
    this.adjustDto = {
      productId: 0,
      newStock: 0,
      reason: '',
      notes: ''
    };
    this.difference = 0;
  }
}
