import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AlertService } from '../services/alert.service';

/**
 * Role Guard
 * Sprint 2 - Autenticación y Autorización
 * 
 * Verifica que el usuario tenga un rol específico
 * Útil para rutas que solo ciertos roles pueden acceder
 */
export const roleGuard: CanActivateFn = (
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

  // Obtener roles permitidos
  const allowedRoles = route.data['roles'] as string[];

  // Si no se especificaron roles, permitir acceso
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  // Obtener rol del usuario actual
  const currentUser = authService.getCurrentUser();
  const userRole = currentUser?.role.name;

  // Verificar si el rol del usuario está en la lista de roles permitidos
  if (userRole && allowedRoles.includes(userRole)) {
    return true;
  }

  // No tiene el rol necesario
  console.warn('Rol insuficiente:', {
    userRole,
    allowedRoles,
    user: currentUser?.username
  });

  alertService.error('No tiene el rol necesario para acceder a esta sección');
  router.navigate(['/']);
  return false;
};