import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';

import { EmployeeService } from '../../services/employee.service';
import { AlertService } from '../../../../core/services/alert.service';
import { AuthService } from '../../../../core/services/auth.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { UserService } from '../../../users/services/user.service';
import { Role } from '../../../users/models/user.model';
import {
  Employee,
  CreateEmployeeDto,
  AREA_LABELS,
  SHIFT_LABELS,
  DOCUMENT_TYPE_LABELS,
  EmployeeArea,
  EmployeeShift,
  DocumentType
} from '../../models/employee.model';

/**
 * Componente de Formulario de Empleado (Crear / Editar)
 * Sprint 4 - Gestión de Empleados
 */
@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoaderComponent],
  templateUrl: './employee-form.component.html',
  styles: []
})
export class EmployeeFormComponent implements OnInit {

  form!: FormGroup;
  currentEmployee: Employee | null = null;

  isEditMode = false;
  employeeId: number | null = null;

  isLoading = false;
  isSaving  = false;

  // Opciones de selects
  areaOptions         = Object.entries(AREA_LABELS).map(([value, label]) => ({ value, label }));
  shiftOptions        = Object.entries(SHIFT_LABELS).map(([value, label]) => ({ value, label }));
  documentTypeOptions = Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => ({ value, label }));

  // Usuarios para vincular (solo admin en creación)
  users: any[] = [];
  isAdmin: boolean;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private employeeService: EmployeeService,
    private userService: UserService,
    private alertService: AlertService,
    private authService: AuthService
  ) {
    this.isAdmin = this.authService.isAdmin();
  }

  ngOnInit(): void {
    this.detectMode();
    this.buildForm();
    if (this.isAdmin && !this.isEditMode) this.loadUsers();
    if (this.isEditMode && this.employeeId)  this.loadEmployee(this.employeeId);
  }

  private detectMode(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode  = true;
      this.employeeId  = Number(id);
    }
  }

  private buildForm(): void {
    this.form = this.fb.group({
      // Datos personales
      firstName:      ['', [Validators.required, Validators.maxLength(100)]],
      lastName:       ['', [Validators.required, Validators.maxLength(100)]],
      documentType:   ['cedula', Validators.required],
      documentNumber: ['', [Validators.required, Validators.maxLength(20)]],
      birthDate:      [null],
      address:        [null],
      phone:          [null, Validators.maxLength(20)],
      email:          [null, Validators.email],
      // Datos laborales
      area:     ['', Validators.required],
      shift:    ['', Validators.required],
      salary:   [null, Validators.min(0)],
      hireDate: [null],
      isActive: [true],
      // Solo admin + crear
      userId: [null]
    });
  }

  private loadUsers(): void {
    this.userService.getRoles().subscribe(); // warm-up
    this.userService.getUsers({ limit: 100, isActive: true }).subscribe({
      next: response => {
        if (response.success && response.data) {
          this.users = response.data.users;
        }
      },
      error: () => {}
    });
  }

  private loadEmployee(id: number): void {
    this.isLoading = true;
    this.employeeService.getEmployeeById(id).subscribe({
      next: response => {
        if (response.success && response.data) {
          this.currentEmployee = response.data;
          this.form.patchValue({
            firstName:      response.data.firstName,
            lastName:       response.data.lastName,
            documentType:   response.data.documentType,
            documentNumber: response.data.documentNumber,
            birthDate:      response.data.birthDate,
            address:        response.data.address,
            phone:          response.data.phone,
            email:          response.data.email,
            area:           response.data.area,
            shift:          response.data.shift,
            salary:         response.data.salary,
            hireDate:       response.data.hireDate,
            isActive:       response.data.isActive
          });
        }
        this.isLoading = false;
      },
      error: () => {
        this.alertService.error('Error al cargar el empleado');
        this.isLoading = false;
      }
    });
  }

  // ─── Envío del formulario ─────────────────────────────────────────────────

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.alertService.error('Por favor corrija los errores en el formulario');
      return;
    }
    this.isSaving = true;
    this.isEditMode ? this.updateEmployee() : this.createEmployee();
  }

  private buildDto(): CreateEmployeeDto {
    const v = this.form.value;
    const dto: CreateEmployeeDto = {
      firstName:      v.firstName,
      lastName:       v.lastName,
      documentType:   v.documentType as DocumentType,
      documentNumber: v.documentNumber,
      area:           v.area as EmployeeArea,
      shift:          v.shift as EmployeeShift,
      birthDate:      v.birthDate   || null,
      address:        v.address     || null,
      phone:          v.phone       || null,
      email:          v.email       || null,
      salary:         v.salary != null && v.salary !== '' ? Number(v.salary) : null,
      hireDate:       v.hireDate    || null,
      isActive:       v.isActive
    };
    if (!this.isEditMode && this.isAdmin && v.userId) {
      dto.userId = Number(v.userId);
    }
    return dto;
  }

  private createEmployee(): void {
    this.employeeService.createEmployee(this.buildDto()).subscribe({
      next: response => {
        if (response.success && response.data) {
          this.alertService.success('Empleado creado exitosamente');
          this.router.navigate(['/employees', response.data.id]);
        }
        this.isSaving = false;
      },
      error: error => {
        this.alertService.error(error?.message || 'Error al crear el empleado');
        this.isSaving = false;
      }
    });
  }

  private updateEmployee(): void {
    const dto = this.buildDto();
    delete (dto as any).userId; // No actualizar vinculación desde aquí

    this.employeeService.updateEmployee(this.employeeId!, dto).subscribe({
      next: response => {
        if (response.success) {
          this.alertService.success('Empleado actualizado exitosamente');
          this.router.navigate(['/employees', this.employeeId]);
        }
        this.isSaving = false;
      },
      error: error => {
        this.alertService.error(error?.message || 'Error al actualizar el empleado');
        this.isSaving = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/employees']);
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
    if (ctrl.hasError('required'))  return 'Este campo es requerido';
    if (ctrl.hasError('email'))     return 'Email inválido';
    if (ctrl.hasError('maxlength')) return `Máximo ${ctrl.errors['maxlength'].requiredLength} caracteres`;
    if (ctrl.hasError('min'))       return `El valor mínimo es ${ctrl.errors['min'].min}`;
    return 'Campo inválido';
  }
}
