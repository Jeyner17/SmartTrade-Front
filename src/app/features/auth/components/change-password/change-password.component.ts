import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';

import { AuthService } from '../../../../core/services/auth.service';
import { AlertService } from '../../../../core/services/alert.service';

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const newPassword    = group.get('newPassword')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  if (newPassword && confirmPassword && newPassword !== confirmPassword) {
    return { passwordsMismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css'
})
export class ChangePasswordComponent {

  form: FormGroup;
  isSaving = false;

  showCurrent  = false;
  showNew      = false;
  showConfirm  = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private alertService: AlertService
  ) {
    this.form = this.fb.group(
      {
        currentPassword:  ['', Validators.required],
        newPassword:      ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword:  ['', Validators.required]
      },
      { validators: passwordsMatchValidator }
    );
  }

  // ── Getters ─────────────────────────────────────────────────────────────────

  get currentPassword()  { return this.form.get('currentPassword')!;  }
  get newPassword()      { return this.form.get('newPassword')!;       }
  get confirmPassword()  { return this.form.get('confirmPassword')!;   }

  // ── Helpers de validación ────────────────────────────────────────────────────

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c.touched);
  }

  getError(field: string): string {
    const c = this.form.get(field);
    if (!c || !c.errors || !c.touched) return '';
    if (c.hasError('required'))   return 'Este campo es requerido';
    if (c.hasError('minlength'))  return `Mínimo ${c.errors['minlength'].requiredLength} caracteres`;
    return 'Campo inválido';
  }

  get confirmError(): string {
    const c = this.confirmPassword;
    if (!c.touched) return '';
    if (c.hasError('required'))              return 'Este campo es requerido';
    if (this.form.hasError('passwordsMismatch')) return 'Las contraseñas no coinciden';
    return '';
  }

  get confirmInvalid(): boolean {
    return this.confirmPassword.touched &&
      (this.confirmPassword.hasError('required') || this.form.hasError('passwordsMismatch'));
  }

  // ── Submit ───────────────────────────────────────────────────────────────────

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;

    this.authService.changePassword({
      currentPassword:  this.currentPassword.value,
      newPassword:      this.newPassword.value,
      confirmPassword:  this.confirmPassword.value
    }).subscribe({
      next: (response) => {
        this.isSaving = false;
        if (response.success) {
          this.alertService.success(
            'Contraseña actualizada correctamente. Se cerrará la sesión por seguridad.'
          );
          setTimeout(() => this.authService.logoutLocal(), 3000);
        }
      },
      error: (error) => {
        this.isSaving = false;
        const errors = error?.error?.errors;
        if (errors?.length) {
          this.alertService.error(errors.map((e: any) => e.message).join('\n'));
        } else if (error?.error?.message) {
          this.alertService.error(error.error.message);
        } else {
          this.alertService.error('Error al cambiar la contraseña');
        }
      }
    });
  }
}
