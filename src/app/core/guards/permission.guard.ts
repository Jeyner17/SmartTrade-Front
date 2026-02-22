import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AlertService } from '../services/alert.service';

/**
 * Permission Guard
 * Sprint 2 - Autenticación y Autorización
 * 
 * Verifica que el usuario tenga los permisos necesarios
 * para acceder a una ruta específica
 */
export const permissionGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const alertService = inject(AlertService);

  // Primero verificar que esté autenticado
  if (!authService.isAuthenticated()) {
    sessionStorage.setItem('returnUrl', state.url);
    router.navigate(['/login']);
    return false;
  }

  // Obtener permisos requeridos de la ruta
  const requiredModule = route.data['module'] as string;
  const requiredAction = route.data['action'] as string;

  // Si no se especificaron permisos, permitir acceso
  if (!requiredModule || !requiredAction) {
    return true;
  }

  // Verificar si tiene el permiso
  const hasPermission = authService.hasPermission(requiredModule, requiredAction);

  if (hasPermission) {
    return true;
  }

  // No tiene permiso
  console.warn('Permiso denegado:', {
    module: requiredModule,
    action: requiredAction,
    user: authService.getCurrentUser()?.username
  });

  alertService.error('No tiene permisos para acceder a esta sección');
  router.navigate(['/access-denied']); 
  return false;
};