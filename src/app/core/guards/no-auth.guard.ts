import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * No Auth Guard
 * Sprint 2 - Autenticación y Autorización
 * 
 * Previene que usuarios autenticados accedan a login
 * Si ya está autenticado, redirige al home
 */
export const noAuthGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si ya está autenticado, redirigir al home
  if (authService.isAuthenticated()) {
    router.navigate(['/']);
    return false;
  }

  // No autenticado, permitir acceso a login
  return true;
};