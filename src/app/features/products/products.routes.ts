import { Routes } from '@angular/router';
import { authGuard, moduleGuard } from '../../core/guards';
import { AUTH_CONSTANTS } from '../../core/constants/auth.constants';

const { MODULES } = AUTH_CONSTANTS;

export const PRODUCTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/product-list/product-list.component')
        .then(m => m.ProductListComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.PRODUCTS },
    title: 'Catálogo de Productos'
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./components/product-form/product-form.component')
        .then(m => m.ProductFormComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.PRODUCTS },
    title: 'Nuevo Producto'
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./components/product-form/product-form.component')
        .then(m => m.ProductFormComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.PRODUCTS },
    title: 'Editar Producto'
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/product-detail/product-detail.component')
        .then(m => m.ProductDetailComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.PRODUCTS },
    title: 'Detalle de Producto'
  }
];
