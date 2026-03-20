import { Routes } from '@angular/router';
import { authGuard, moduleGuard } from '../../core/guards';
import { AUTH_CONSTANTS } from '../../core/constants/auth.constants';

const { MODULES } = AUTH_CONSTANTS;

export const PURCHASES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/purchase-list/purchase-list.component').then(m => m.PurchaseListComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.PURCHASES },
    title: 'Órdenes de Compra'
  },
  {
    path: 'new',
    loadComponent: () => import('./components/purchase-form/purchase-form.component').then(m => m.PurchaseFormComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.PURCHASES },
    title: 'Nueva Orden de Compra'
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./components/purchase-form/purchase-form.component').then(m => m.PurchaseFormComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.PURCHASES },
    title: 'Editar Orden de Compra'
  },
  {
    path: ':id',
    loadComponent: () => import('./components/purchase-detail/purchase-detail.component').then(m => m.PurchaseDetailComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.PURCHASES },
    title: 'Detalle Orden de Compra'
  }
];
