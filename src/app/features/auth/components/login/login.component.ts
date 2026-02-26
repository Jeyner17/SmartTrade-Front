import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { AlertService } from '../../../../core/services/alert.service';
import { APP_CONSTANTS } from '../../../../core/constants/app.constants';
import { AUTH_CONSTANTS } from '../../../../core/constants/auth.constants';

/**
 * Componente de Login
 * Sprint 2 - Autenticación y Autorización
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {

  loginForm!: FormGroup;
  isLoading = false;
  showPassword = false;

  // Datos de la aplicación
  appName = APP_CONSTANTS.APP_NAME;
  appVersion = APP_CONSTANTS.VERSION;

  // Logo (se obtiene de la configuración del sistema)
  companyLogo: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private alertService: AlertService,
    private router: Router
  ) {
    // Verificar si ya está autenticado
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }
  }

  ngOnInit(): void {
    this.initializeForm();
    // TODO: Cargar logo de la empresa desde settings
  }

  /**
   * Inicializar formulario de login
   */
  private initializeForm(): void {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  /**
   * Manejar envío del formulario
   */
  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    if (this.isLoading) {
      return;
    }

    this.isLoading = true;

    const { username, password, rememberMe } = this.loginForm.value;

    this.authService.login({ username, password }, rememberMe).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.alertService.success(`¡Bienvenido ${response.data.user.fullName}!`);

          // Redirigir según el rol
          this.redirectAfterLogin(response.data.user.role.name);
        }
      },
      error: (error) => {
        console.error('Error en login:', error);
        this.isLoading = false;

        // Mostrar mensaje de error
        const errorMessage = error.message || 'Error al iniciar sesión. Por favor, intente nuevamente.';
        this.alertService.error(errorMessage);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  /**
   * Redirigir después del login según el rol y returnUrl
   */
  private redirectAfterLogin(roleName: string): void {
    // Verificar si hay una URL de retorno guardada
    const returnUrl = sessionStorage.getItem('returnUrl');

    if (returnUrl && returnUrl !== '/login') {
      // Limpiar returnUrl
      sessionStorage.removeItem('returnUrl');

      // Redirigir a la URL original
      this.router.navigateByUrl(returnUrl);
    } else {
      // Redirigir según el rol (personalizable en futuros sprints)
      this.redirectByRole(roleName);
    }
  }

  /**
   * Redirigir según los módulos accesibles del usuario
   */
  private redirectByRole(roleName: string): void {
    const { MODULES } = AUTH_CONSTANTS;

    // Módulos con ruta frontend, en orden de prioridad
    const moduleRoutes = [
      { module: MODULES.SETTINGS,   route: '/settings' },
      { module: MODULES.USERS,      route: '/users' },
      { module: MODULES.EMPLOYEES,  route: '/employees' },
    ];

    for (const entry of moduleRoutes) {
      if (this.authService.hasModuleAccess(entry.module)) {
        this.router.navigate([entry.route]);
        return;
      }
    }

    this.alertService.warning('No tiene acceso a ningún módulo disponible. Contacte al administrador.');
  }

  /**
   * Alternar visibilidad de contraseña
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Verificar si un campo tiene error
   */
  hasError(field: string, error: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control && control.hasError(error) && control.touched);
  }

  /**
   * Obtener mensaje de error para un campo
   */
  getErrorMessage(field: string): string {
    const control = this.loginForm.get(field);

    if (!control || !control.errors || !control.touched) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Este campo es requerido';
    }

    if (control.hasError('minlength')) {
      const minLength = control.errors['minlength'].requiredLength;
      return `Mínimo ${minLength} caracteres`;
    }

    return 'Campo inválido';
  }

  /**
   * Manejar "¿Olvidaste tu contraseña?"
   */
  onForgotPassword(): void {
    this.alertService.info('Funcionalidad en desarrollo. Contacte al administrador.');
    // TODO: Implementar recuperación de contraseña en futuro sprint
  }
}