import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { InventoryService } from '../../services/inventory.service';
import { StockMovement, MovementFilters, ProductStock } from '../../models/inventory.model';

/**
 * Pantalla 2: Historial de Movimientos de Inventario
 * Sprint 7 - Gestión de Inventario
 */
@Component({
  selector: 'app-inventory-movements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory-movements.component.html',
  styleUrl: './inventory-movements.component.css'
})
export class InventoryMovementsComponent implements OnInit {
  productId!: number;
  productStock: ProductStock | null = null;
  movements: StockMovement[] = [];
  loading = false;
  error: string | null = null;

  filters: MovementFilters = {
    page: 1,
    limit: 20,
    startDate: '',
    endDate: '',
    movementType: undefined
  };

  pagination = {
    total: 0,
    page: 1,
    limit: 20,
    pages: 0,
    hasNext: false,
    hasPrev: false
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private inventoryService: InventoryService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.productId = +params['id'];
      if (this.productId) {
        this.loadProductStock();
        this.loadMovements();
      }
    });
  }

  loadProductStock(): void {
    this.inventoryService.getProductStock(this.productId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.productStock = response.data;
        }
      },
      error: (err) => {
        console.error('Error al cargar stock del producto:', err);
        // Si es error 401, mostrar mensaje de sesión expirada
        if (err.status === 401) {
          this.error = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
        }
      }
    });
  }

  loadMovements(): void {
    this.loading = true;
    this.error = null;

    this.inventoryService.getMovementHistory(this.productId, this.filters).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.movements = response.data.movements;
          this.pagination = response.data.pagination;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar movimientos:', err);
        console.error('Detalles del error:', err.error);
        console.error('Status:', err.status);

        // Mostrar mensaje más específico
        if (err.status === 0) {
          this.error = 'No se puede conectar al servidor. Verifica que el backend esté corriendo.';
        } else if (err.status === 401) {
          this.error = 'Sesión expirada o no autorizado. Por favor, inicia sesión nuevamente.';
        } else if (err.status === 403) {
          this.error = 'No tienes permisos para ver el historial de movimientos.';
        } else if (err.status === 404) {
          this.error = 'Producto no encontrado.';
        } else if (err.status === 500) {
          this.error = err.error?.message || 'Error interno del servidor. Revisa los logs del backend.';
        } else {
          this.error = err.error?.message || 'Error al cargar el historial de movimientos';
        }

        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.filters.page = 1;
    this.loadMovements();
  }

  clearFilters(): void {
    this.filters = {
      page: 1,
      limit: 20,
      startDate: '',
      endDate: '',
      movementType: undefined
    };
    this.loadMovements();
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.pagination.pages) {
      this.filters.page = page;
      this.loadMovements();
    }
  }

  getMovementTypeClass(movement: StockMovement): string {
    switch (movement.movementType) {
      case 'entrada':
        return 'text-success';
      case 'salida':
        return 'text-danger';
      case 'ajuste':
        return 'text-warning';
      case 'inicial':
        return 'text-info';
      default:
        return 'text-muted';
    }
  }

  getMovementTypeBadge(movement: StockMovement): string {
    switch (movement.movementType) {
      case 'entrada':
        return 'bg-success';
      case 'salida':
        return 'bg-danger';
      case 'ajuste':
        return 'bg-warning';
      case 'inicial':
        return 'bg-info';
      default:
        return 'bg-secondary';
    }
  }

  getMovementTypeLabel(movement: StockMovement): string {
    switch (movement.movementType) {
      case 'entrada':
        return 'Entrada';
      case 'salida':
        return 'Salida';
      case 'ajuste':
        return 'Ajuste';
      case 'inicial':
        return 'Inicial';
      default:
        return movement.movementType;
    }
  }

  goBack(): void {
    this.router.navigate(['/inventory']);
  }

  refresh(): void {
    this.loadProductStock();
    this.loadMovements();
  }
}
