import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BarcodeService } from '../../services/barcode.service';
import { ProductService } from '../../../products/services/product.service';
import {
  GenerateQrDto, QrType, QrSize,
  QR_TYPE_LABELS, QR_SIZE_LABELS, QR_SIZE_WIDTH
} from '../../models/barcode.model';

/**
 * Pantalla 4 – Generador de Códigos QR
 * Sprint 11 - Barcode/QR Module
 *
 * Backend acepta: type = 'producto' | 'factura' | 'credito'
 * Backend acepta: options.width (entero 100–1000)
 */
@Component({
  selector: 'app-qr-generator',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './qr-generator.component.html',
  styleUrl: './qr-generator.component.css'
})
export class QrGeneratorComponent {

  readonly QR_TYPE_LABELS = QR_TYPE_LABELS;
  readonly QR_SIZE_LABELS = QR_SIZE_LABELS;
  readonly qrTypes: QrType[] = ['producto', 'factura', 'credito'];
  readonly qrSizes: QrSize[] = ['small', 'medium', 'large'];

  // Formulario general
  selectedType: QrType = 'producto';
  selectedSize: QrSize = 'medium';
  qrColor = '#000000';
  includeLogo = false;

  // ── Tipo Producto: buscador ──────────────────────
  productSearch = '';
  productSearchResults: any[] = [];
  selectedProduct: any = null;
  isSearching = false;

  // ── Tipo Factura ─────────────────────────────────
  invoiceNumber = '';
  invoicePaymentLink = '';

  // ── Tipo Crédito ─────────────────────────────────
  clientName = '';
  creditAmount = '';
  creditPaymentLink = '';

  // Estado QR
  isLoading = false;
  qrBase64 = '';
  errorMessage = '';
  copySuccess = false;

  constructor(
    private barcodeService: BarcodeService,
    private productService: ProductService
  ) {}

  // ── Buscar producto ──────────────────────────────

  searchProduct(): void {
    const q = this.productSearch.trim();
    if (q.length < 2) { this.productSearchResults = []; return; }
    this.isSearching = true;
    this.selectedProduct = null;

    this.productService.getProducts({ search: q, page: 1, limit: 8 }).subscribe({
      next: (res) => {
        this.isSearching = false;
        this.productSearchResults = (res.data as any)?.products ?? [];
      },
      error: () => { this.isSearching = false; }
    });
  }

  selectProduct(p: any): void {
    this.selectedProduct = p;
    this.productSearch = p.name;
    this.productSearchResults = [];
  }

  clearProduct(): void {
    this.selectedProduct = null;
    this.productSearch = '';
    this.productSearchResults = [];
  }

  // ── Generar QR ───────────────────────────────────

  generate(): void {
    this.isLoading = true;
    this.qrBase64 = '';
    this.errorMessage = '';

    this.barcodeService.generateQr(this.buildDto()).subscribe({
      next: (res) => {
        this.isLoading = false;
        const d = res.data as any;
        if (d?.qrBase64) {
          this.qrBase64 = d.qrBase64;
        } else {
          this.errorMessage = 'No se pudo generar el código QR.';
        }
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Error al comunicarse con el servidor.';
      }
    });
  }

  private buildDto(): GenerateQrDto {
    const data: Record<string, unknown> = {};

    switch (this.selectedType) {
      case 'producto':
        data['productId']   = this.selectedProduct?.id;
        data['productName'] = this.selectedProduct?.name;
        data['barcode']     = this.selectedProduct?.barcode;
        data['price']       = this.selectedProduct?.price;
        break;
      case 'factura':
        data['invoiceNumber']     = this.invoiceNumber;
        if (this.invoicePaymentLink) data['paymentLink'] = this.invoicePaymentLink;
        break;
      case 'credito':
        data['client']       = this.clientName;
        data['amount']       = Number(this.creditAmount);
        if (this.creditPaymentLink) data['paymentLink'] = this.creditPaymentLink;
        break;
    }

    return {
      type: this.selectedType,
      data,
      options: {
        width: QR_SIZE_WIDTH[this.selectedSize],   // backend espera entero px
        color: this.qrColor,
        includeLogo: this.includeLogo
      }
    };
  }

  get canGenerate(): boolean {
    if (this.isLoading) return false;
    switch (this.selectedType) {
      case 'producto': return !!this.selectedProduct;
      case 'factura':  return !!this.invoiceNumber;
      case 'credito':  return !!this.clientName && !!this.creditAmount;
      default: return false;
    }
  }

  get qrImageSrc(): string { return `data:image/png;base64,${this.qrBase64}`; }

  download(): void {
    if (!this.qrBase64) return;
    const a = document.createElement('a');
    a.href = this.qrImageSrc;
    a.download = `qr-${this.selectedType}-${Date.now()}.png`;
    a.click();
  }

  print(): void {
    if (!this.qrBase64) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Código QR</title>
      <style>body{display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#fff}</style>
      </head><body>
      <img src="${this.qrImageSrc}" style="max-width:500px" />
      <script>window.onload=()=>{window.print();window.close()}<\/script>
      </body></html>`);
    win.document.close();
  }

  async copyToClipboard(): Promise<void> {
    if (!this.qrBase64) return;
    try {
      const resp = await fetch(this.qrImageSrc);
      const blob = await resp.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    } catch {
      await navigator.clipboard.writeText(this.qrBase64);
    }
    this.copySuccess = true;
    setTimeout(() => { this.copySuccess = false; }, 2000);
  }

  onTypeChange(): void {
    this.qrBase64 = '';
    this.errorMessage = '';
    this.selectedProduct = null;
    this.productSearch = '';
    this.productSearchResults = [];
  }
}
