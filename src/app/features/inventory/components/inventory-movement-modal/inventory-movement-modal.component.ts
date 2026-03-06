import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InventoryService } from '../../services/inventory.service';
import { ProductService } from '../../../products/services/product.service';
import {
  RegisterMovementDto,
  MovementType,
  MovementReason,
  MOVEMENT_TYPES,
  MOVEMENT_REASONS,
  MOVEMENT_REASONS_BY_TYPE
} from '../../models/inventory.model';
import { Product } from '../../../products/models/product.model';

@Component({
  selector: 'app-inventory-movement-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory-movement-modal.component.html',
  styleUrls: ['./inventory-movement-modal.component.css']
})
export class InventoryMovementModalComponent implements OnInit {
  @Input() productId?: number;
  @Output() onClose = new EventEmitter<void>();
  @Output() onSuccess = new EventEmitter<void>();

  // Modal state
  isVisible = false;
  isSubmitting = false;
  errorMessage = '';

  // Form data
  movement: RegisterMovementDto = {
    productId: 0,
    movementType: 'entrada',
    quantity: 1,
    reason: 'compra',
    notes: ''
  };

  // Product search and selection
  products: Product[] = [];
  selectedProduct: Product | null = null;
  productSearch = '';
  isLoadingProducts = false;
  showProductDropdown = false;

  // Current stock
  currentStock = 0;
  newStock = 0;

  // Constants
  movementTypes = MOVEMENT_TYPES;
  movementReasons = MOVEMENT_REASONS_BY_TYPE;

  constructor(
    private inventoryService: InventoryService,
    private productService: ProductService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.productId) {
      this.movement.productId = this.productId;
      this.loadProductInfo();
    }
  }

  open(): void {
    this.isVisible = true;
    this.resetForm();
    if(!this.productId) {
      this.searchProducts();
    }
  }

  close(): void {
    this.isVisible = false;
    this.resetForm();
    this.onClose.emit();
  }

  async searchProducts(): Promise<void> {
    if (this.productSearch.length < 2) {
      this.products = [];
      return;
    }

    this.isLoadingProducts = true;
    try {
      this.productService.getProducts({ search: this.productSearch, limit: 10 }).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.products = response.data.products || [];
          }
          this.isLoadingProducts = false;
          this.showProductDropdown = true;
        },
        error: (err: any) => {
          console.error('Error searching products:', err);
          this.products = [];
          this.isLoadingProducts = false;
        }
      });
    } catch (error) {
      console.error('Error searching products:', error);
      this.products = [];
      this.isLoadingProducts = false;
    }
  }

  selectProduct(product: Product): void {
    this.selectedProduct = product;
    this.movement.productId = product.id;
    this.productSearch = `${product.name} (${product.sku})`;
    this.showProductDropdown = false;
    this.loadProductStock();
  }

  async loadProductInfo(): Promise<void> {
    this.productService.getProductById(this.productId!).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.selectedProduct = response.data;
          this.productSearch = `${response.data.name} (${response.data.sku})`;
          this.loadProductStock();
        }
      },
      error: (err: any) => {
        console.error('Error loading product:', err);
      }
    });
  }

  loadProductStock(): void {
    if (!this.movement.productId) return;

    this.inventoryService.getProductStock(this.movement.productId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.currentStock = response.data.stockStatus.current;
          this.calculateNewStock();
        }
      },
      error: (err: any) => {
        console.error('Error loading stock:', err);
        this.currentStock = 0;
      }
    });
  }

  calculateNewStock(): void {
    const quantity = this.movement.quantity || 0;

    if (this.movement.movementType === 'entrada') {
      this.newStock = this.currentStock + quantity;
    } else if (this.movement.movementType === 'salida') {
      this.newStock = this.currentStock - quantity;
    }
  }

  onQuantityChange(): void {
    this.calculateNewStock();
  }

  onMovementTypeChange(): void {
    this.calculateNewStock();
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.inventoryService.registerMovement(this.movement).subscribe({
      next: (response) => {
        if (response.success) {
          this.onSuccess.emit();
          this.close();
        }
        this.isSubmitting = false;
      },
      error: (err: any) => {
        console.error('Error registering movement:', err);
        this.errorMessage = err.error?.message || 'Error al registrar el movimiento';
        this.isSubmitting = false;
      }
    });
  }

  validateForm(): boolean {
    if (!this.movement.productId) {
      this.errorMessage = 'Debe seleccionar un producto';
      return false;
    }

    if (!this.movement.quantity || this.movement.quantity <= 0) {
      this.errorMessage = 'La cantidad debe ser mayor a 0';
      return false;
    }

    if (this.movement.movementType === 'salida' && this.newStock < 0) {
      this.errorMessage = 'No hay suficiente stock disponible';
      return false;
    }

    if (!this.movement.reason) {
      this.errorMessage = 'Debe seleccionar un motivo';
      return false;
    }

    return true;
  }

  resetForm(): void {
    if (!this.productId) {
      this.movement = {
        productId: 0,
        movementType: 'entrada',
        quantity: 1,
        reason: 'compra',
        notes: ''
      };
      this.selectedProduct = null;
      this.productSearch = '';
      this.products = [];
      this.showProductDropdown = false;
    } else {
      this.movement = {
        productId: this.productId,
        movementType: 'entrada',
        quantity: 1,
        reason: 'compra',
        notes: ''
      };
    }
    this.currentStock = 0;
    this.newStock = 0;
    this.errorMessage = '';
  }

  onClickOutsideDropdown(): void {
    this.showProductDropdown = false;
  }
}
