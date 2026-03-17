import { Routes } from '@angular/router';
import { authGuard, moduleGuard } from '../../core/guards';
import { AUTH_CONSTANTS } from '../../core/constants/auth.constants';

const { MODULES } = AUTH_CONSTANTS;

export const BARCODES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/barcodes-page/barcodes-page.component')
      .then(m => m.BarcodesPageComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.BARCODES },
    title: 'Códigos de Barra / QR'
  },
  {
    path: 'price-check',
    loadComponent: () => import('./components/price-check/price-check.component')
      .then(m => m.PriceCheckComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.BARCODES },
    title: 'Verificación Rápida de Precios'
  },
  {
    path: 'pos-scanner',
    loadComponent: () => import('./components/pos-scanner/pos-scanner.component')
      .then(m => m.PosScannerComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.BARCODES },
    title: 'Escáner Punto de Venta'
  },
  {
    path: 'inventory-scanner',
    loadComponent: () => import('./components/inventory-scanner/inventory-scanner.component')
      .then(m => m.InventoryScannerComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.BARCODES },
    title: 'Escáner de Inventario'
  },
  {
    path: 'qr-generator',
    loadComponent: () => import('./components/qr-generator/qr-generator.component')
      .then(m => m.QrGeneratorComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.BARCODES },
    title: 'Generador de Códigos QR'
  },
  {
    path: 'settings',
    loadComponent: () => import('./components/scanner-settings/scanner-settings.component')
      .then(m => m.ScannerSettingsComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.BARCODES },
    title: 'Configuración del Escáner'
  }
];
