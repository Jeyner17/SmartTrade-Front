import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AlertService } from '../services/alert.service';

/**
 * Admin Guard
 * Sprint 2 - Autenticación y Autorización
 * 
 * Permite acceso SOLO a administradores
 * Útil para secciones críticas del sistema
 */
export const adminGuard: CanActivateFn = (
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

  // Verificar si es administrador
  if (authService.isAdmin()) {
    return true;
  }

  // No es administrador
  console.warn('Acceso de administrador denegado:', {
    user: authService.getCurrentUser()?.username
  });

  alertService.error('Esta sección es solo para administradores');
  router.navigate(['/']);
  return false;
};