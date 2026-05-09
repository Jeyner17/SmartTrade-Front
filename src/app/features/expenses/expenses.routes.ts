import { Routes } from '@angular/router';
import { authGuard, moduleGuard } from '../../core/guards';
import { AUTH_CONSTANTS } from '../../core/constants/auth.constants';

const { MODULES } = AUTH_CONSTANTS;

export const EXPENSES_ROUTES: Routes = [
  // Pantalla 1: Lista de gastos (ruta raíz)
  {
    path: '',
    loadComponent: () => import('./components/expense-list/expense-list.component')
      .then(m => m.ExpenseListComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.EXPENSES },
    title: 'Gastos Operativos'
  },
  // Pantalla 2: Nuevo gasto
  {
    path: 'new',
    loadComponent: () => import('./components/expense-form/expense-form.component')
      .then(m => m.ExpenseFormComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.EXPENSES },
    title: 'Nuevo Gasto'
  },
  // Pantalla 2: Editar gasto
  {
    path: 'edit/:id',
    loadComponent: () => import('./components/expense-form/expense-form.component')
      .then(m => m.ExpenseFormComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.EXPENSES },
    title: 'Editar Gasto'
  },
  // Pantalla 3: Categorías
  {
    path: 'categories',
    loadComponent: () => import('./components/expense-categories/expense-categories.component')
      .then(m => m.ExpenseCategoriesComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.EXPENSES },
    title: 'Categorías de Gastos'
  },
  // Pantalla 4: Detalle
  {
    path: 'detail/:id',
    loadComponent: () => import('./components/expense-detail/expense-detail.component')
      .then(m => m.ExpenseDetailComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.EXPENSES },
    title: 'Detalle de Gasto'
  },
  // Pantalla 5: Recurrentes
  {
    path: 'recurring',
    loadComponent: () => import('./components/expense-recurring/expense-recurring.component')
      .then(m => m.ExpenseRecurringComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.EXPENSES },
    title: 'Gastos Recurrentes'
  },
  // Pantalla 6: Reporte por categoría
  {
    path: 'report',
    loadComponent: () => import('./components/expense-report/expense-report.component')
      .then(m => m.ExpenseReportComponent),
    canActivate: [authGuard, moduleGuard],
    data: { module: MODULES.EXPENSES },
    title: 'Reporte de Gastos'
  }
];
