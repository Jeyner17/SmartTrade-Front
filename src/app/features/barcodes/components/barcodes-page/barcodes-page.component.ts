import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface ModuleCard {
  icon: string;
  title: string;
  description: string;
  route: string;
  color: string;
  badge?: string;
}

/**
 * Página Principal – Módulo Códigos de Barra / QR
 * Sprint 11 - Barcode/QR Module
 */
@Component({
  selector: 'app-barcodes-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './barcodes-page.component.html',
  styleUrl: './barcodes-page.component.css'
})
export class BarcodesPageComponent {

  readonly cards: ModuleCard[] = [
    {
      icon: 'bi-tag-fill',
      title: 'Verificación de Precios',
      description: 'Consulta rápida de precios escaneando el código del producto. Sin autenticación para clientes.',
      route: '/barcodes/price-check',
      color: 'violet',
      badge: 'Público'
    },
    {
      icon: 'bi-calculator',
      title: 'Escáner POS',
      description: 'Integra el escáner directamente en el punto de venta para agregar productos al carrito automáticamente.',
      route: '/barcodes/pos-scanner',
      color: 'blue'
    },
    {
      icon: 'bi-clipboard-check',
      title: 'Conteo de Inventario',
      description: 'Realiza conteos físicos de inventario con el escáner y detecta discrepancias automáticamente.',
      route: '/barcodes/inventory-scanner',
      color: 'green'
    },
    {
      icon: 'bi-qr-code',
      title: 'Generador QR',
      description: 'Crea códigos QR personalizados para productos, facturas, créditos o contenido personalizado.',
      route: '/barcodes/qr-generator',
      color: 'orange'
    },
    {
      icon: 'bi-sliders',
      title: 'Configuración',
      description: 'Ajusta el tipo de escáner, formatos de código, sonidos y el comportamiento del sistema.',
      route: '/barcodes/settings',
      color: 'gray'
    }
  ];
}
