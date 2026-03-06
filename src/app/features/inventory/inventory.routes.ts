import { Routes } from '@angular/router';
import { authGuard, moduleGuard } from '../../core/guards';
import { AUTH_CONSTANTS } from '../../core/constants/auth.constants';

const { MODULES } = AUTH_CONSTANTS;

export const INVENTORY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/inventory-list/inventory-list.component')
        .then(m => m.InventoryListComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.INVENTORY },
    title: 'Inventario'
  },
  {
    path: 'alerts',
    loadComponent: () =>
      import('./components/inventory-alerts/inventory-alerts.component')
        .then(m => m.InventoryAlertsComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.INVENTORY },
    title: 'Alertas de Stock Bajo'
  },
  {
    path: 'adjust',
    loadComponent: () =>
      import('./components/inventory-adjust/inventory-adjust.component')
        .then(m => m.InventoryAdjustComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.INVENTORY },
    title: 'Ajustar Inventario'
  },
  {
    path: 'movements/:id',
    loadComponent: () =>
      import('./components/inventory-movements/inventory-movements.component')
        .then(m => m.InventoryMovementsComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.INVENTORY },
    title: 'Historial de Movimientos'
  }
];
