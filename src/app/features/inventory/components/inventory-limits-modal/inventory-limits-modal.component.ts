import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InventoryService } from '../../services/inventory.service';
import { ProductService } from '../../../products/services/product.service';
import { UpdateStockLimitsDto } from '../../models/inventory.model';
import { Product } from '../../../products/models/product.model';

@Component({
  selector: 'app-inventory-limits-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory-limits-modal.component.html',
  styleUrl: './inventory-limits-modal.component.css'
})
export class InventoryLimitsModalComponent implements OnInit {
  @Input() productId?: number;
  @Output() onClose = new EventEmitter<void>();
  @Output() onSuccess = new EventEmitter<void>();

  // Modal state
  isVisible = false;
  isSubmitting = false;
  errorMessage = '';

  // Form data
  limitsDto: UpdateStockLimitsDto = {
    minStock: 0,
    maxStock: undefined,
    location: ''
  };

  // Product info
  product: Product | null = null;
  currentStock = 0;
  isLoadingProduct = false;

  constructor(
    private inventoryService: InventoryService,
    private productService: ProductService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.productId) {
      this.loadProductInfo();
    }
  }

  open(): void {
    this.isVisible = true;
    this.loadProductInfo();
  }

  close(): void {
    this.isVisible = false;
    this.resetForm();
    this.onClose.emit();
  }

  loadProductInfo(): void {
    if (!this.productId) return;

    this.isLoadingProduct = true;
    this.productService.getProductById(this.productId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.product = response.data;
          // Pre-fill existing limits
          this.limitsDto = {
            minStock: this.product.minStock || 0,
            maxStock: this.product.maxStock || undefined,
            location: this.product.location || ''
          };
          this.loadProductStock();
        }
        this.isLoadingProduct = false;
      },
      error: (err: any) => {
        console.error('Error loading product:', err);
        this.errorMessage = 'Error al cargar la información del producto';
        this.isLoadingProduct = false;
      }
    });
  }

  loadProductStock(): void {
    if (!this.productId) return;

    this.inventoryService.getProductStock(this.productId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.currentStock = response.data.stockStatus.current;
        }
      },
      error: (err: any) => {
        console.error('Error loading stock:', err);
      }
    });
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    if (!this.productId) {
      this.errorMessage = 'No se ha seleccionado un producto';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    // Prepare DTO - remove maxStock if undefined
    const dto = { ...this.limitsDto };
    if (dto.maxStock === undefined || dto.maxStock === null || dto.maxStock === 0) {
      delete dto.maxStock;
    }

    this.inventoryService.updateStockLimits(this.productId, dto).subscribe({
      next: (response) => {
        if (response.success) {
          this.onSuccess.emit();
          this.close();
        }
        this.isSubmitting = false;
      },
      error: (err: any) => {
        console.error('Error updating limits:', err);
        this.errorMessage = err.error?.message || 'Error al actualizar los límites de stock';
        this.isSubmitting = false;
      }
    });
  }

  validateForm(): boolean {
    if (!this.productId) {
      this.errorMessage = 'No se ha seleccionado un producto';
      return false;
    }

    if (this.limitsDto.minStock < 0) {
      this.errorMessage = 'El stock mínimo no puede ser negativo';
      return false;
    }

    if (this.limitsDto.maxStock !== undefined && this.limitsDto.maxStock !== null) {
      if (this.limitsDto.maxStock < 0) {
        this.errorMessage = 'El stock máximo no puede ser negativo';
        return false;
      }

      if (this.limitsDto.maxStock < this.limitsDto.minStock) {
        this.errorMessage = 'El stock máximo debe ser mayor o igual al stock mínimo';
        return false;
      }
    }

    return true;
  }

  resetForm(): void {
    this.limitsDto = {
      minStock: 0,
      maxStock: undefined,
      location: ''
    };
    this.errorMessage = '';
    this.product = null;
    this.currentStock = 0;
  }

  getStockStatus(): { class: string; label: string } {
    if (!this.limitsDto.minStock || this.currentStock === 0) {
      return { class: 'text-muted', label: 'Sin configurar' };
    }

    if (this.currentStock <= 0) {
      return { class: 'text-danger', label: 'Agotado' };
    }

    if (this.currentStock <= this.limitsDto.minStock) {
      return { class: 'text-warning', label: 'Stock bajo' };
    }

    if (this.limitsDto.maxStock && this.currentStock >= this.limitsDto.maxStock) {
      return { class: 'text-info', label: 'Stock alto' };
    }

    return { class: 'text-success', label: 'Stock normal' };
  }
}
