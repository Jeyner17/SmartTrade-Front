import { Routes } from '@angular/router';
import { LayoutComponent } from './shared/components/layout/layout.component';

// Guards
import { authGuard, noAuthGuard, permissionGuard, moduleGuard } from './core/guards';

// Constantes
import { AUTH_CONSTANTS } from './core/constants/auth.constants';

const { MODULES, ACTIONS } = AUTH_CONSTANTS;

export const routes: Routes = [
  // RUTA PÚBLICA: LOGIN
  {
    path: 'login',
    loadComponent: () => import('./features/auth/components/login/login.component')
      .then(m => m.LoginComponent),
    canActivate: [noAuthGuard],
    title: 'Iniciar Sesión'
  },
  // RUTA PÚBLICA: ACCESO DENEGADO
  {
    path: 'access-denied',
    loadComponent: () => import('./shared/components/access-denied/access-denied.component')
      .then(m => m.AccessDeniedComponent),
    title: 'Acceso Denegado'
  },

  // RUTAS PROTEGIDAS CON LAYOUT
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard], // Proteger todo el layout
    children: [
      // Settings - Requiere autenticación y permiso de view en settings
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/components/settings-page/settings-page.component')
          .then(m => m.SettingsPageComponent),
        canActivate: [moduleGuard],
        data: {
          module: MODULES.SETTINGS
        },
        title: 'Configuración del Sistema'
      },

      // Sprint 3: Gestión de Usuarios
      {
        path: 'users',
        loadChildren: () => import('./features/users/users.routes')
          .then(m => m.USERS_ROUTES),
        data: { module: MODULES.USERS }
      },

      // Sprint 4: Gestión de Empleados
      {
        path: 'employees',
        loadChildren: () => import('./features/employees/employees.routes')
          .then(m => m.EMPLOYEES_ROUTES),
        data: { module: MODULES.EMPLOYEES }
      },

      // Sprint 5: Gestión de Categorías
      {
        path: 'categories',
        loadChildren: () => import('./features/categories/categories.routes')
          .then(m => m.CATEGORIES_ROUTES),
        data: { module: MODULES.CATEGORIES }
      },

      // Sprint 6: Gestión de Productos
      {
        path: 'products',
        loadChildren: () => import('./features/products/products.routes')
          .then(m => m.PRODUCTS_ROUTES),
        data: { module: MODULES.PRODUCTS }
      },

      // Sprint 8: Gestión de Proveedores
      {
        path: 'suppliers',
        loadChildren: () => import('./features/suppliers/suppliers.routes')
          .then(m => m.SUPPLIERS_ROUTES),
        data: { module: MODULES.SUPPLIERS }
      },

      // Cambiar contraseña (accesible para cualquier usuario autenticado)
      {
        path: 'change-password',
        loadComponent: () => import('./features/auth/components/change-password/change-password.component')
          .then(m => m.ChangePasswordComponent),
        title: 'Cambiar Contraseña'
      },

      // Ruta por defecto dentro del layout
      {
        path: '',
        redirectTo: 'settings',
        pathMatch: 'full'
      }
    ]
  },

  // WILDCARD: REDIRIGIR A LOGIN
  {
    path: '**',
    redirectTo: 'login'
  }
];