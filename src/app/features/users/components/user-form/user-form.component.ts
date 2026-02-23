import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { UserService } from '../../services/user.service';
import { AlertService } from '../../../../core/services/alert.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { User, Role, CreateUserDto, UpdateUserDto } from '../../models/user.model';

/**
 * Componente de Formulario de Usuario (Crear / Editar)
 * Sprint 3 - Gestión de Usuarios
 */
@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoaderComponent],
  templateUrl: './user-form.component.html',
  styles: []
})
export class UserFormComponent implements OnInit, OnDestroy {

  form!: FormGroup;
  roles: Role[] = [];
  currentUser: User | null = null;

  isEditMode = false;
  userId: number | null = null;

  isLoading = false;
  isSaving = false;
  showPassword = false;

  // Disponibilidad de username/email
  usernameAvailable: boolean | null = null;
  emailAvailable: boolean | null = null;
  checkingUsername = false;
  checkingEmail = false;

  // Modal contraseña temporal (solo en creación)
  showPasswordModal = false;
  temporaryPassword = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.detectMode();
    this.buildForm();
    this.loadRoles();
    this.setupAvailabilityChecks();
    if (this.isEditMode && this.userId) {
      this.loadUser(this.userId);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Inicialización ──────────────────────────────────────────────────────

  private detectMode(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode = true;
      this.userId = Number(id);
    }
  }

  private buildForm(): void {
    const baseFields = {
      username:  ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20), Validators.pattern(/^[a-zA-Z0-9_]+$/)]],
      email:     ['', [Validators.required, Validators.email]],
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName:  ['', [Validators.required, Validators.minLength(2)]],
      roleId:    ['', Validators.required]
    };

    if (this.isEditMode) {
      this.form = this.fb.group({ ...baseFields, isActive: [true] });
    } else {
      this.form = this.fb.group({
        ...baseFields,
        password: ['', []],
        mustChangePassword: [true]
      });
    }
  }

  private setupAvailabilityChecks(): void {
    // Username
    this.form.get('username')?.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(value => {
      this.usernameAvailable = null;
      if (value && value.length >= 3) {
        this.checkingUsername = true;
        this.userService.checkAvailability(value, undefined, this.userId || undefined).subscribe({
          next: res => {
            this.usernameAvailable = res.data?.username?.available ?? null;
            this.checkingUsername = false;
          },
          error: () => { this.checkingUsername = false; }
        });
      }
    });

    // Email
    this.form.get('email')?.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(value => {
      this.emailAvailable = null;
      if (value && value.includes('@')) {
        this.checkingEmail = true;
        this.userService.checkAvailability(undefined, value, this.userId || undefined).subscribe({
          next: res => {
            this.emailAvailable = res.data?.email?.available ?? null;
            this.checkingEmail = false;
          },
          error: () => { this.checkingEmail = false; }
        });
      }
    });
  }

  private loadRoles(): void {
    this.userService.getRoles().subscribe({
      next: response => {
        if (response.success && response.data) {
          this.roles = response.data.roles;
        }
      },
      error: () => { this.alertService.error('Error al cargar los roles'); }
    });
  }

  private loadUser(id: number): void {
    this.isLoading = true;
    this.userService.getUserById(id).subscribe({
      next: response => {
        if (response.success && response.data) {
          this.currentUser = response.data.user;
          this.form.patchValue({
            username:  response.data.user.username,
            email:     response.data.user.email,
            firstName: response.data.user.firstName,
            lastName:  response.data.user.lastName,
            roleId:    response.data.user.roleId,
            isActive:  response.data.user.isActive
          });
        }
        this.isLoading = false;
      },
      error: () => {
        this.alertService.error('Error al cargar el usuario');
        this.isLoading = false;
      }
    });
  }

  // ─── Acciones del formulario ──────────────────────────────────────────────

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  submit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.alertService.error('Por favor corrija los errores en el formulario');
      return;
    }
    if (this.usernameAvailable === false) {
      this.alertService.error('El nombre de usuario no está disponible');
      return;
    }
    if (this.emailAvailable === false) {
      this.alertService.error('El email no está disponible');
      return;
    }

    this.isSaving = true;
    this.isEditMode ? this.updateUser() : this.createUser();
  }

  private createUser(): void {
    const dto: CreateUserDto = {
      username:           this.form.value.username,
      email:              this.form.value.email,
      firstName:          this.form.value.firstName,
      lastName:           this.form.value.lastName,
      roleId:             Number(this.form.value.roleId),
      mustChangePassword: this.form.value.mustChangePassword
    };
    if (this.form.value.password) dto.password = this.form.value.password;

    this.userService.createUser(dto).subscribe({
      next: response => {
        if (response.success && response.data) {
          this.alertService.success('Usuario creado exitosamente');
          if (response.data.temporaryPassword) {
            this.temporaryPassword = response.data.temporaryPassword;
            this.showPasswordModal = true;
          } else {
            this.router.navigate(['/users']);
          }
        }
        this.isSaving = false;
      },
      error: error => {
        this.alertService.error(error?.message || 'Error al crear el usuario');
        this.isSaving = false;
      }
    });
  }

  private updateUser(): void {
    const dto: UpdateUserDto = {
      username:  this.form.value.username,
      email:     this.form.value.email,
      firstName: this.form.value.firstName,
      lastName:  this.form.value.lastName,
      roleId:    Number(this.form.value.roleId),
      isActive:  this.form.value.isActive
    };

    this.userService.updateUser(this.userId!, dto).subscribe({
      next: response => {
        if (response.success) {
          this.alertService.success('Usuario actualizado exitosamente');
          this.router.navigate(['/users', this.userId]);
        }
        this.isSaving = false;
      },
      error: error => {
        this.alertService.error(error?.message || 'Error al actualizar el usuario');
        this.isSaving = false;
      }
    });
  }

  copyPassword(): void {
    navigator.clipboard.writeText(this.temporaryPassword).then(() => {
      this.alertService.success('Contraseña copiada al portapapeles');
    });
  }

  closePasswordModal(): void {
    this.showPasswordModal = false;
    this.router.navigate(['/users']);
  }

  cancel(): void {
    this.router.navigate(['/users']);
  }

  // ─── Helpers de validación ────────────────────────────────────────────────

  isFieldInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }

  isFieldValid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.valid && ctrl.touched);
  }

  getErrorMessage(field: string): string {
    const ctrl = this.form.get(field);
    if (!ctrl?.errors || !ctrl.touched) return '';
    if (ctrl.hasError('required'))   return 'Este campo es requerido';
    if (ctrl.hasError('email'))      return 'Email inválido';
    if (ctrl.hasError('minlength'))  return `Mínimo ${ctrl.errors['minlength'].requiredLength} caracteres`;
    if (ctrl.hasError('maxlength'))  return `Máximo ${ctrl.errors['maxlength'].requiredLength} caracteres`;
    if (ctrl.hasError('pattern'))    return 'Solo letras, números y guiones bajos';
    return 'Campo inválido';
  }
}
