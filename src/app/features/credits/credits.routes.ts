import { Routes } from '@angular/router';
import { authGuard, moduleGuard } from '../../core/guards';
import { AUTH_CONSTANTS } from '../../core/constants/auth.constants';

const { MODULES } = AUTH_CONSTANTS;

export const creditsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/credits-list.component')
      .then(m => m.CreditsListComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.CREDITS },
    title: 'Créditos Activos'
  },
  {
    path: 'nuevo-cliente',
    loadComponent: () => import('./components/credit-customer-form.component')
      .then(m => m.CreditCustomerFormComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.CREDITS },
    title: 'Nuevo Cliente de Crédito'
  },
  {
    path: 'nuevo-credito',
    loadComponent: () => import('./components/credit-form.component')
      .then(m => m.CreditFormComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.CREDITS },
    title: 'Crear Nuevo Crédito'
  },
  {
    path: 'detalle/:id',
    loadComponent: () => import('./components/credit-detail.component')
      .then(m => m.CreditDetailComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.CREDITS },
    title: 'Detalle de Crédito'
  },
  {
    path: 'estado-cuenta/:id',
    loadComponent: () => import('./components/customer-statement.component')
      .then(m => m.CustomerStatementComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.CREDITS },
    title: 'Estado de Cuenta'
  },
  {
    path: 'morosos',
    loadComponent: () => import('./components/delinquent-customers.component')
      .then(m => m.DelinquentCustomersComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.CREDITS },
    title: 'Clientes Morosos'
  }
];
