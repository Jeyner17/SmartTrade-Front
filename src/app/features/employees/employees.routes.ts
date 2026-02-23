import { Routes } from '@angular/router';
import { authGuard, moduleGuard } from '../../core/guards';
import { AUTH_CONSTANTS } from '../../core/constants/auth.constants';

const { MODULES } = AUTH_CONSTANTS;

export const EMPLOYEES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/employee-list/employee-list.component')
      .then(m => m.EmployeeListComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.EMPLOYEES },
    title: 'Gestión de Empleados'
  },
  {
    path: 'new',
    loadComponent: () => import('./components/employee-form/employee-form.component')
      .then(m => m.EmployeeFormComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.EMPLOYEES },
    title: 'Nuevo Empleado'
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./components/employee-form/employee-form.component')
      .then(m => m.EmployeeFormComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.EMPLOYEES },
    title: 'Editar Empleado'
  },
  {
    path: ':id',
    loadComponent: () => import('./components/employee-detail/employee-detail.component')
      .then(m => m.EmployeeDetailComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.EMPLOYEES },
    title: 'Detalle de Empleado'
  }
];
