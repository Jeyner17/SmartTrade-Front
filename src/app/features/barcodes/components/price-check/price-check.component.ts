import { Component, OnInit, OnDestroy, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BarcodeService } from '../../services/barcode.service';
import { ScannedProduct, ScanHistoryItem } from '../../models/barcode.model';

/**
 * Pantalla 1 – Verificación Rápida de Precios
 * Sprint 11 - Barcode/QR Module
 */
@Component({
  selector: 'app-price-check',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './price-check.component.html',
  styleUrl: './price-check.component.css'
})
export class PriceCheckComponent implements OnInit, OnDestroy {

  @ViewChild('scanInput') scanInput!: ElementRef<HTMLInputElement>;

  // Estado del escáner
  scannerStatus: 'ready' | 'scanning' | 'success' | 'error' = 'ready';
  scannedProduct: ScannedProduct | null = null;
  errorMessage = '';
  scanHistory: ScanHistoryItem[] = [];

  // Buffer de teclado para escáner físico
  private keyBuffer = '';
  private keyBufferTimer: ReturnType<typeof setTimeout> | null = null;
  private resetTimer: ReturnType<typeof setTimeout> | null = null;

  // Loading
  isLoading = false;

  // Input manual
  manualCode = '';
  showManualInput = false;

  constructor(private barcodeService: BarcodeService) {}

  ngOnInit(): void {
    // Enfocar el input oculto para capturar el escáner físico
    setTimeout(() => this.focusScanInput(), 200);
  }

  ngOnDestroy(): void {
    if (this.keyBufferTimer) clearTimeout(this.keyBufferTimer);
    if (this.resetTimer) clearTimeout(this.resetTimer);
  }

  // ─── Listener global para escáner físico (USB HID) ──────────────────────────
  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Ignorar si el foco está en un input manual visible
    const tag = (event.target as HTMLElement).tagName.toLowerCase();
    if (tag === 'input' && (event.target as HTMLInputElement).id === 'manual-input') {
      return;
    }

    if (event.key === 'Enter') {
      if (this.keyBuffer.length > 3) {
        this.processCode(this.keyBuffer.trim());
      }
      this.keyBuffer = '';
      return;
    }

    if (event.key.length === 1) {
      this.keyBuffer += event.key;
    }

    // Limpiar buffer si pasan más de 100ms (indica escritura manual, no escáner)
    if (this.keyBufferTimer) clearTimeout(this.keyBufferTimer);
    this.keyBufferTimer = setTimeout(() => {
      this.keyBuffer = '';
    }, 100);
  }

  private focusScanInput(): void {
    this.scanInput?.nativeElement?.focus();
  }

  processCode(code: string): void {
    if (this.isLoading || !code) return;

    this.scannerStatus = 'scanning';
    this.isLoading = true;
    this.scannedProduct = null;
    this.errorMessage = '';

    this.barcodeService.scanBarcode(code).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.data?.product) {
          this.scannedProduct = res.data.product;
          this.scannerStatus = 'success';
          this.playBeep(true);
          this.addToHistory(code, res.data.product);
          this.scheduleReset();
        } else {
          this.scannerStatus = 'error';
          this.errorMessage = res.data?.message || 'Producto no encontrado';
          this.playBeep(false);
        }
      },
      error: () => {
        this.isLoading = false;
        this.scannerStatus = 'error';
        this.errorMessage = 'Error al consultar el servidor. Verifique la conexión.';
        this.playBeep(false);
      }
    });

    this.manualCode = '';
    this.showManualInput = false;
  }

  scanManual(): void {
    if (this.manualCode.trim()) {
      this.processCode(this.manualCode.trim());
    }
  }

  scanAnother(): void {
    if (this.resetTimer) clearTimeout(this.resetTimer);
    this.scannedProduct = null;
    this.scannerStatus = 'ready';
    this.errorMessage = '';
    this.focusScanInput();
  }

  toggleManualInput(): void {
    this.showManualInput = !this.showManualInput;
    if (this.showManualInput) {
      setTimeout(() => {
        const el = document.getElementById('manual-input') as HTMLInputElement;
        el?.focus();
      }, 150);
    }
  }

  private addToHistory(code: string, product: ScannedProduct): void {
    const item: ScanHistoryItem = { barcode: code, product, scannedAt: new Date() };
    this.scanHistory = [item, ...this.scanHistory].slice(0, 5);
  }

  private scheduleReset(): void {
    if (this.resetTimer) clearTimeout(this.resetTimer);
    this.resetTimer = setTimeout(() => {
      this.scanAnother();
    }, 10000);
  }

  private playBeep(success: boolean): void {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = success ? 880 : 330;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch { /* sin audio */ }
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(price);
  }

  getTimeAgo(date: Date): string {
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Hace un momento';
    if (diffMin === 1) return 'Hace 1 min';
    return `Hace ${diffMin} min`;
  }
}
