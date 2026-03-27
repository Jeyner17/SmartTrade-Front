import { Routes } from '@angular/router';
import { authGuard, moduleGuard } from '../../core/guards';
import { AUTH_CONSTANTS } from '../../core/constants/auth.constants';

const { MODULES } = AUTH_CONSTANTS;

export const RECEPTION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/reception-list/reception-list.component').then(m => m.ReceptionListComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.RECEPTION },
    title: 'Recepciones'
  },
  {
    path: 'process',
    loadComponent: () => import('./components/reception-process/reception-process.component').then(m => m.ReceptionProcessComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.RECEPTION },
    title: 'Proceso de Recepción'
  },
  {
    path: ':id/summary',
    loadComponent: () => import('./components/reception-summary/reception-summary.component').then(m => m.ReceptionSummaryComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.RECEPTION },
    title: 'Resumen de Recepción'
  },
  {
    path: 'discrepancies/new',
    loadComponent: () => import('./components/discrepancy-form/discrepancy-form.component').then(m => m.DiscrepancyFormComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.RECEPTION },
    title: 'Registrar Discrepancia'
  },
  {
    path: 'discrepancies/history',
    loadComponent: () => import('./components/discrepancy-history/discrepancy-history.component').then(m => m.DiscrepancyHistoryComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.RECEPTION },
    title: 'Historial de Discrepancias'
  }
];
