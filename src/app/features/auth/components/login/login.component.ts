import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { AlertService } from '../../../../core/services/alert.service';
import { APP_CONSTANTS } from '../../../../core/constants/app.constants';

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
   * Redirigir según el rol del usuario
   */
  private redirectByRole(roleName: string): void {
    // Por ahora todos van a settings
    // En futuros sprints se puede personalizar:

    // switch (roleName) {
    //   case 'Administrador':
    //     this.router.navigate(['/dashboard']);
    //     break;
    //   case 'Cajero':
    //     this.router.navigate(['/pos']);
    //     break;
    //   case 'Bodeguero':
    //     this.router.navigate(['/inventory']);
    //     break;
    //   default:
    //     this.router.navigate(['/']);
    // }

    // Por ahora todos van a settings
    this.router.navigate(['/settings']);
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