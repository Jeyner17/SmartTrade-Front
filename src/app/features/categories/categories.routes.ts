import { Routes } from '@angular/router';
import { authGuard, moduleGuard } from '../../core/guards';
import { AUTH_CONSTANTS } from '../../core/constants/auth.constants';

const { MODULES } = AUTH_CONSTANTS;

export const CATEGORIES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/category-list/category-list.component')
        .then(m => m.CategoryListComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.CATEGORIES },
    title: 'Categorías'
  },
  {
    path: ':id/products',
    loadComponent: () =>
      import('./components/category-products/category-products.component')
        .then(m => m.CategoryProductsComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.CATEGORIES },
    title: 'Productos por Categoría'
  }
];
