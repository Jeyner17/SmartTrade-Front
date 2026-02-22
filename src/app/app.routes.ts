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

      // Dashboard (ejemplo futuro)
      // {
      //   path: 'dashboard',
      //   loadComponent: () => import('./features/dashboard/dashboard.component')
      //     .then(m => m.DashboardComponent),
      //   canActivate: [authGuard],
      //   title: 'Dashboard'
      // },

      // Productos (ejemplo futuro con permisos específicos)
      // {
      //   path: 'products',
      //   loadComponent: () => import('./features/products/products.component')
      //     .then(m => m.ProductsComponent),
      //   canActivate: [permissionGuard],
      //   data: {
      //     module: MODULES.PRODUCTS,
      //     action: ACTIONS.VIEW
      //   },
      //   title: 'Productos'
      // },

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