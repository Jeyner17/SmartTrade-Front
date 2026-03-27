import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { InventoryService } from '../../services/inventory.service';
import { InventoryItem, InventoryFilters, InventoryValue } from '../../models/inventory.model';
import { AlertService } from '../../../../core/services/alert.service';

/**
 * Pantalla 1: Vista General de Inventario
 * Sprint 7 - Gestión de Inventario
 */
@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory-list.component.html',
  styleUrl: './inventory-list.component.css'
})
export class InventoryListComponent implements OnInit {
  // Estado
  inventory: InventoryItem[] = [];
  value: InventoryValue | null = null;
  loading = false;
  error: string | null = null;

  // Filtros
  filters: InventoryFilters = {
    page: 1,
    limit: 10,
    search: '',
    categoryId: undefined,
    lowStock: undefined,
    outOfStock: undefined
  };

  // Paginación
  pagination = {
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
    hasNext: false,
    hasPrev: false
  };

  // Estadísticas
  stats = {
    totalValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    lastUpdate: new Date()
  };

  // Modal de edición de Min/Max Stock
  showEditStockLimitsModal = false;
  selectedItem: InventoryItem | null = null;
  editMinStock = 0;
  editMaxStock: number | null = null;
  editLocation = '';
  isSavingStockLimits = false;

  constructor(
    private inventoryService: InventoryService,
    private alertService: AlertService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadInventory();
    this.loadInventoryValue();
  }

  /**
   * Cargar inventario
   */
  loadInventory(): void {
    this.loading = true;
    this.error = null;

    this.inventoryService.getInventory(this.filters).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.inventory = response.data.inventory;
          this.pagination = response.data.pagination;
          this.calculateStats();
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar inventario:', err);
        this.error = 'Error al cargar el inventario';
        this.loading = false;
      }
    });
  }

  /**
   * Cargar valor del inventario
   */
  loadInventoryValue(): void {
    this.inventoryService.getInventoryValue().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.value = response.data;
          this.stats.totalValue = response.data.summary.totalSaleValue;
        }
      },
      error: (err) => {
        console.error('Error al cargar valor del inventario:', err);
      }
    });
  }

  /**
   * Calcular estadísticas
   */
  calculateStats(): void {
    this.stats.lowStockCount = this.inventory.filter(
      item => item.stock > 0 && item.stock <= item.minStock
    ).length;

    this.stats.outOfStockCount = this.inventory.filter(
      item => item.stock === 0
    ).length;

    if (this.inventory.length > 0) {
      const latest = this.inventory.reduce((prev, current) =>
        new Date(current.updatedAt) > new Date(prev.updatedAt) ? current : prev
      );
      this.stats.lastUpdate = new Date(latest.updatedAt);
    }
  }

  /**
   * Aplicar filtros
   */
  applyFilters(): void {
    this.filters.page = 1;
    this.loadInventory();
  }

  /**
   * Limpiar filtros
   */
  clearFilters(): void {
    this.filters = {
      page: 1,
      limit: 10,
      search: '',
      categoryId: undefined,
      lowStock: undefined,
      outOfStock: undefined
    };
    this.loadInventory();
  }

  /**
   * Cambiar página
   */
  changePage(page: number): void {
    if (page >= 1 && page <= this.pagination.pages) {
      this.filters.page = page;
      this.loadInventory();
    }
  }

  /**
   * Ir a historial de movimientos
   */
  goToMovements(item: InventoryItem): void {
    this.router.navigate(['/inventory/movements', item.id]);
  }

  /**
   * Ir a ajuste de inventario
   */
  goToAdjust(): void {
    this.router.navigate(['/inventory/adjust']);
  }

  /**
   * Ir a alertas de stock bajo
   */
  goToAlerts(): void {
    this.router.navigate(['/inventory/alerts']);
  }

  /**
   * Obtener clase CSS para el stock
   */
  getStockClass(item: InventoryItem): string {
    return this.inventoryService.getStockStatusClass(
      item.stock,
      item.minStock,
      item.maxStock
    );
  }

  /**
   * Obtener badge de estado
   */
  getStockBadge(item: InventoryItem): string {
    return this.inventoryService.getStockStatusBadge(
      item.stock,
      item.minStock,
      item.maxStock
    );
  }

  /**
   * Obtener etiqueta de estado
   */
  getStockLabel(item: InventoryItem): string {
    return this.inventoryService.getStockStatusLabel(
      item.stock,
      item.minStock,
      item.maxStock
    );
  }

  /**
   * Ver más detalles del producto
   */
  viewDetails(item: InventoryItem): void {
    this.router.navigate(['/products', item.id]);
  }

  /**
   * Refrescar datos
   */
  refresh(): void {
    this.loadInventory();
    this.loadInventoryValue();
  }

  /**
   * Abrir modal para editar límites de stock (Mín/Máx)
   */
  openEditStockLimitsModal(item: InventoryItem): void {
    this.selectedItem = item;
    this.editMinStock = item.minStock || 0;
    this.editMaxStock = item.maxStock || null;
    this.editLocation = item.location || '';
    this.showEditStockLimitsModal = true;
  }

  /**
   * Cerrar modal de edición
   */
  closeEditStockLimitsModal(): void {
    this.showEditStockLimitsModal = false;
    this.selectedItem = null;
    this.editMinStock = 0;
    this.editMaxStock = null;
    this.editLocation = '';
    this.isSavingStockLimits = false;
  }

  /**
   * Guardar cambios de Mín/Máx stock
   */
  saveStockLimits(): void {
    if (!this.selectedItem) return;

    // Validaciones
    if (this.editMinStock < 0) {
      this.alertService.warning('El stock mínimo no puede ser negativo');
      return;
    }

    if (this.editMaxStock !== null && this.editMaxStock < 0) {
      this.alertService.warning('El stock máximo no puede ser negativo');
      return;
    }

    if (this.editMaxStock !== null && this.editMinStock > this.editMaxStock) {
      this.alertService.warning('El stock mínimo debe ser menor o igual al máximo');
      return;
    }

    this.isSavingStockLimits = true;
    const updates = {
      minStock: this.editMinStock,
      maxStock: this.editMaxStock,
      location: this.editLocation.trim() || null
    };

    this.inventoryService.updateStockLimits(this.selectedItem.id, updates).subscribe({
      next: () => {
        this.alertService.success('Límites y ubicación actualizados correctamente');
        this.closeEditStockLimitsModal();
        this.loadInventory();
      },
      error: () => {
        this.alertService.error('Error al actualizar los límites de stock');
        this.isSavingStockLimits = false;
      }
    });
  }
}
