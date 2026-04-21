import { Routes } from '@angular/router';
import { authGuard, moduleGuard } from '../../core/guards';
import { AUTH_CONSTANTS } from '../../core/constants/auth.constants';

const { MODULES } = AUTH_CONSTANTS;

export const CASH_REGISTER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/cash-open/cash-open.component')
      .then(m => m.CashOpenComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.CASH_REGISTER },
    title: 'Apertura de Caja'
  },
  {
    path: 'status',
    loadComponent: () => import('./components/cash-status/cash-status.component')
      .then(m => m.CashStatusComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.CASH_REGISTER },
    title: 'Estado de Caja'
  },
  {
    path: 'close',
    loadComponent: () => import('./components/cash-close/cash-close.component')
      .then(m => m.CashCloseComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.CASH_REGISTER },
    title: 'Cierre de Caja'
  },
  {
    path: 'report/:id',
    loadComponent: () => import('./components/cash-report/cash-report.component')
      .then(m => m.CashReportComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.CASH_REGISTER },
    title: 'Reporte de Cierre'
  },
  {
    path: 'history',
    loadComponent: () => import('./components/cash-history/cash-history.component')
      .then(m => m.CashHistoryComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.CASH_REGISTER },
    title: 'Historial de Caja'
  }
];
