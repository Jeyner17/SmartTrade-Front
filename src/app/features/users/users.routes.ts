import { Routes } from '@angular/router';
import { authGuard, moduleGuard } from '../../core/guards';
import { AUTH_CONSTANTS } from '../../core/constants/auth.constants';

const { MODULES } = AUTH_CONSTANTS;

export const USERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/user-list/user-list.component')
      .then(m => m.UserListComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.USERS },
    title: 'Gestión de Usuarios'
  },
  {
    path: 'new',
    loadComponent: () => import('./components/user-form/user-form.component')
      .then(m => m.UserFormComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.USERS },
    title: 'Nuevo Usuario'
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./components/user-form/user-form.component')
      .then(m => m.UserFormComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.USERS },
    title: 'Editar Usuario'
  },
  {
    path: ':id',
    loadComponent: () => import('./components/user-detail/user-detail.component')
      .then(m => m.UserDetailComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.USERS },
    title: 'Detalle de Usuario'
  }
];
