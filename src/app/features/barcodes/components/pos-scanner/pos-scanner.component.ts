import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BarcodeService } from '../../services/barcode.service';
import { ScannedProduct } from '../../models/barcode.model';

interface CartItem {
  product: ScannedProduct;
  quantity: number;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

/**
 * Pantalla 2 – Escáner Punto de Venta (POS)
 * Sprint 11 - Barcode/QR Module
 */
@Component({
  selector: 'app-pos-scanner',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './pos-scanner.component.html',
  styleUrl: './pos-scanner.component.css'
})
export class PosScannerComponent implements OnInit, OnDestroy {

  // Estado del escáner
  scannerActive = false;
  isScanning = false;
  lastScannedCode = '';

  // Carrito
  cart: CartItem[] = [];
  recentAnimation = -1;  // índice del item recién agregado

  // Toasts
  toasts: Toast[] = [];
  private toastCounter = 0;

  // Buffer de teclado para escáner físico
  private keyBuffer = '';
  private keyBufferTimer: ReturnType<typeof setTimeout> | null = null;

  // Input manual
  manualCode = '';
  showCameraInput = false;

  constructor(private barcodeService: BarcodeService) {}

  ngOnInit(): void {
    this.scannerActive = true;
  }

  ngOnDestroy(): void {
    if (this.keyBufferTimer) clearTimeout(this.keyBufferTimer);
  }

  // ─── Escáner físico ──────────────────────────────────────────────────────────
  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.scannerActive) return;
    const tag = (event.target as HTMLElement).tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;

    if (event.key === 'Enter') {
      if (this.keyBuffer.length > 3) {
        this.scan(this.keyBuffer.trim());
      }
      this.keyBuffer = '';
      return;
    }

    if (event.key.length === 1) {
      this.keyBuffer += event.key;
    }

    if (this.keyBufferTimer) clearTimeout(this.keyBufferTimer);
    this.keyBufferTimer = setTimeout(() => { this.keyBuffer = ''; }, 100);
  }

  toggleScanner(): void {
    this.scannerActive = !this.scannerActive;
    if (this.scannerActive) {
      this.showToast('Escáner activado', 'info');
    }
  }

  scan(code: string): void {
    if (this.isScanning || !code) return;
    this.isScanning = true;
    this.lastScannedCode = code;

    this.barcodeService.scanBarcode(code).subscribe({
      next: (res) => {
        this.isScanning = false;
        if (res.data?.product) {
          this.addToCart(res.data.product);
          this.playBeep(true);
        } else {
          this.showToast(res.data?.message || 'Producto no encontrado', 'error');
          this.playBeep(false);
        }
      },
      error: () => {
        this.isScanning = false;
        this.showToast('Error al conectar con el servidor', 'error');
        this.playBeep(false);
      }
    });

    this.manualCode = '';
    this.showCameraInput = false;
  }

  scanManual(): void {
    if (this.manualCode.trim()) {
      this.scan(this.manualCode.trim());
    }
  }

  addToCart(product: ScannedProduct): void {
    const existingIdx = this.cart.findIndex(c => c.product.id === product.id);
    if (existingIdx >= 0) {
      this.cart[existingIdx].quantity++;
      this.animateItem(existingIdx);
      this.showToast(`${product.name} +1 (x${this.cart[existingIdx].quantity})`, 'success');
    } else {
      this.cart.unshift({ product, quantity: 1 });
      this.animateItem(0);
      this.showToast(`${product.name} agregada al carrito`, 'success');
    }
  }

  removeFromCart(idx: number): void {
    this.cart.splice(idx, 1);
  }

  updateQty(idx: number, delta: number): void {
    const newQty = this.cart[idx].quantity + delta;
    if (newQty <= 0) {
      this.cart.splice(idx, 1);
    } else {
      this.cart[idx].quantity = newQty;
    }
  }

  clearCart(): void {
    this.cart = [];
    this.showToast('Carrito vaciado', 'info');
  }

  private animateItem(idx: number): void {
    this.recentAnimation = idx;
    setTimeout(() => { this.recentAnimation = -1; }, 600);
  }

  private showToast(message: string, type: 'success' | 'error' | 'info'): void {
    const id = ++this.toastCounter;
    this.toasts.push({ id, message, type });
    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t.id !== id);
    }, 3500);
  }

  private playBeep(success: boolean): void {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = success ? 1200 : 300;
      osc.type = 'square';
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start(); osc.stop(ctx.currentTime + 0.15);
    } catch { /* sin audio */ }
  }

  get total(): number {
    return this.cart.reduce((s, c) => s + c.product.price * c.quantity, 0);
  }

  get totalItems(): number {
    return this.cart.reduce((s, c) => s + c.quantity, 0);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(price);
  }
}
