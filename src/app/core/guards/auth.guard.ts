import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Auth Guard
 * Sprint 2 - Autenticación y Autorización
 * 
 * Protege rutas que requieren autenticación
 * Redirige a login si no está autenticado
 */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificar si el usuario está autenticado
  if (authService.isAuthenticated()) {
    return true;
  }

  // No autenticado - guardar URL intentada y redirigir a login
  console.log('Usuario no autenticado, redirigiendo a login');
  console.log('URL intentada:', state.url);

  // Guardar URL de retorno en sessionStorage
  sessionStorage.setItem('returnUrl', state.url);

  // Redirigir a login
  router.navigate(['/login']);
  return false;
};