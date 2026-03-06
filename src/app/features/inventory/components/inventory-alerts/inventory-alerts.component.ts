import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { InventoryService } from '../../services/inventory.service';
import { LowStockAlert, LowStockAlertsResponse } from '../../models/inventory.model';

/**
 * Pantalla 6: Alertas de Stock Bajo
 * Sprint 7 - Gestión de Inventario
 */
@Component({
  selector: 'app-inventory-alerts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inventory-alerts.component.html',
  styleUrl: './inventory-alerts.component.css'
})
export class InventoryAlertsComponent implements OnInit {
  alerts: LowStockAlert[] = [];
  summary = {
    total: 0,
    outOfStock: 0,
    critical: 0,
    warning: 0
  };
  loading = false;
  error: string | null = null;

  constructor(
    private inventoryService: InventoryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAlerts();
  }

  loadAlerts(): void {
    this.loading = true;
    this.error = null;

    this.inventoryService.getLowStockAlerts().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.alerts = response.data.alerts;
          this.summary = response.data.summary;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar alertas:', err);
        this.error = 'Error al cargar las alertas de stock bajo';
        this.loading = false;
      }
    });
  }

  goToProduct(alert: LowStockAlert): void {
    this.router.navigate(['/products', alert.id]);
  }

  goToMovements(alert: LowStockAlert): void {
    this.router.navigate(['/inventory/movements', alert.id]);
  }

  goToAdjust(): void {
    this.router.navigate(['/inventory/adjust']);
  }

  goBack(): void {
    this.router.navigate(['/inventory']);
  }

  getSeverityClass(alert: LowStockAlert): string {
    if (alert.stock === 0) return 'danger';
    if (alert.stock <= alert.minStock * 0.3) return 'danger';
    return 'warning';
  }

  getSeverityLabel(alert: LowStockAlert): string {
    if (alert.stock === 0) return 'Crítico - Sin Stock';
    if (alert.stock <= alert.minStock * 0.3) return 'Crítico';
    return 'Advertencia';
  }

  refresh(): void {
    this.loadAlerts();
  }
}
