import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AlertService } from '../services/alert.service';
import { AUTH_CONSTANTS } from '../constants/auth.constants';

/**
 * Module Guard
 * Sprint 2 - Autenticación y Autorización
 * 
 * Verifica que el usuario tenga acceso a un módulo completo
 * (más flexible que permissionGuard - solo verifica acceso al módulo)
 */
export const moduleGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const alertService = inject(AlertService);

  // Verificar autenticación
  if (!authService.isAuthenticated()) {
    sessionStorage.setItem('returnUrl', state.url);
    router.navigate(['/login']);
    return false;
  }

  // Obtener módulo requerido
  const requiredModule = route.data['module'] as string;

  // Si no se especificó módulo, permitir acceso
  if (!requiredModule) {
    return true;
  }

  // Verificar acceso al módulo
  const hasAccess = authService.hasModuleAccess(requiredModule);

  if (hasAccess) {
    return true;
  }

  // No tiene acceso
  console.warn('Acceso al módulo denegado:', {
    module: requiredModule,
    user: authService.getCurrentUser()?.username
  });

  alertService.error(`No tiene permisos para acceder a este módulo`);

  // Navegar al primer módulo accesible para evitar bucle infinito
  const { MODULES } = AUTH_CONSTANTS;
  const moduleRoutes = [
    { module: MODULES.SETTINGS,   route: '/settings' },
    { module: MODULES.USERS,      route: '/users' },
    { module: MODULES.EMPLOYEES,  route: '/employees' },
  ];

  for (const entry of moduleRoutes) {
    if (entry.module !== requiredModule && authService.hasModuleAccess(entry.module)) {
      router.navigate([entry.route]);
      return false;
    }
  }

  // Sin ningún módulo accesible — cerrar sesión
  authService.logoutLocal();
  return false;
};