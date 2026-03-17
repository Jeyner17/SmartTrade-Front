import { Component, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BarcodeService } from '../../services/barcode.service';
import { InventoryCountItem } from '../../models/barcode.model';

type SessionState = 'idle' | 'setup' | 'counting' | 'paused' | 'finished';

/**
 * Pantalla 3 – Escáner de Inventario
 * Sprint 11 - Barcode/QR Module
 */
@Component({
  selector: 'app-inventory-scanner',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './inventory-scanner.component.html',
  styleUrl: './inventory-scanner.component.css'
})
export class InventoryScannerComponent implements OnDestroy {

  state: SessionState = 'idle';
  sessionId: number | null = null;

  // Setup form
  countName = '';
  categoryId: number | null = null;

  // Items del conteo
  items: InventoryCountItem[] = [];

  // Buffer escáner físico
  private keyBuffer = '';
  private keyBufferTimer: ReturnType<typeof setTimeout> | null = null;

  // Input manual
  manualCode = '';
  showManualInput = false;

  // Loading
  isLoading = false;
  lastError = '';
  lastScannedName = '';
  showScanFlash = false;

  constructor(private barcodeService: BarcodeService) {}

  ngOnDestroy(): void {
    if (this.keyBufferTimer) clearTimeout(this.keyBufferTimer);
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (this.state !== 'counting') return;
    const tag = (event.target as HTMLElement).tagName.toLowerCase();
    if (tag === 'input') return;

    if (event.key === 'Enter') {
      if (this.keyBuffer.length > 3) this.processScan(this.keyBuffer.trim());
      this.keyBuffer = '';
      return;
    }
    if (event.key.length === 1) this.keyBuffer += event.key;
    if (this.keyBufferTimer) clearTimeout(this.keyBufferTimer);
    this.keyBufferTimer = setTimeout(() => { this.keyBuffer = ''; }, 100);
  }

  startSetup(): void { this.state = 'setup'; }

  startCount(): void {
    if (!this.countName.trim()) return;
    // El backend no tiene endpoint de sesión de conteo:
    // la sesión se gestiona localmente en el frontend.
    this.sessionId = Date.now();
    this.state = 'counting';
  }

  processScan(code: string): void {
    if (!code || this.isLoading) return;
    this.isLoading = true;
    this.lastError = '';

    this.barcodeService.scanBarcode(code).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.data?.product) {
          this.registerScan(code, res.data.product);
        } else {
          this.lastError = 'Producto no encontrado: ' + code;
        }
      },
      error: () => {
        this.isLoading = false;
        this.lastError = 'Error al conectar. Verifique el servidor.';
      }
    });

    this.manualCode = '';
    this.showManualInput = false;
  }

  private registerScan(code: string, product: any): void {
    const existing = this.items.find(i => i.barcode === code);
    if (existing) {
      existing.scannedQuantity++;
      existing.difference = existing.scannedQuantity - existing.systemStock;
    } else {
      const newItem: InventoryCountItem = {
        productId: product.id,
        productName: product.name,
        barcode: code,
        scannedQuantity: 1,
        systemStock: product.stock,
        difference: 1 - product.stock,
        unit: product.unit
      };
      this.items.unshift(newItem);
    }
    this.lastScannedName = product.name;
    this.showScanFlash = true;
    setTimeout(() => { this.showScanFlash = false; }, 700);
  }

  scanManual(): void {
    if (this.manualCode.trim()) this.processScan(this.manualCode.trim());
  }

  pause(): void { this.state = 'paused'; }
  resume(): void { this.state = 'counting'; }

  cancel(): void {
    this.state = 'idle';
    this.items = [];
    this.countName = '';
    this.sessionId = null;
  }

  finalize(): void {
    // Finalización local: el backend no tiene endpoint de cierre de sesión de conteo.
    this.state = 'finished';
  }

  generateAdjust(): void {
    if (this.items.length === 0) { this.cancel(); return; }
    this.isLoading = true;

    const adjustItems = this.items.map(i => ({
      productId: i.productId,
      countedQuantity: i.scannedQuantity,
      reason: 'Conteo físico de inventario'
    }));

    this.barcodeService.applyInventoryAdjust(adjustItems).subscribe({
      next: () => { this.isLoading = false; this.cancel(); },
      error: () => { this.isLoading = false; this.cancel(); }
    });
  }

  get totalUnique(): number { return this.items.length; }
  get totalUnits(): number { return this.items.reduce((s, i) => s + i.scannedQuantity, 0); }
  get discrepancies(): number { return this.items.filter(i => i.difference !== 0).length; }

  hasDiff(item: InventoryCountItem): boolean { return item.difference !== 0; }
  diffClass(item: InventoryCountItem): string {
    if (item.difference > 0) return 'diff-positive';
    if (item.difference < 0) return 'diff-negative';
    return '';
  }
  formatDiff(diff: number): string { return diff > 0 ? `+${diff}` : `${diff}`; }
}
