import { Routes } from '@angular/router';
import { authGuard, moduleGuard } from '../../core/guards';
import { AUTH_CONSTANTS } from '../../core/constants/auth.constants';

const { MODULES } = AUTH_CONSTANTS;

export const POS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/pos-main/pos-main.component').then(m => m.PosMainComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.POS },
    title: 'Punto de Venta'
  },
  {
    path: 'history',
    loadComponent: () => import('./components/sales-history/sales-history.component').then(m => m.SalesHistoryComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.SALES },
    title: 'Historial de Ventas'
  },
  {
    path: 'ticket/:id',
    loadComponent: () => import('./components/ticket-preview/ticket-preview.component').then(m => m.TicketPreviewComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.SALES },
    title: 'Ticket de Venta'
  }
];
