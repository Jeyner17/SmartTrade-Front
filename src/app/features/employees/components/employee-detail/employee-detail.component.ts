import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { EmployeeService } from '../../services/employee.service';
import { AuthService } from '../../../../core/services/auth.service';
import { AlertService } from '../../../../core/services/alert.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { AttendancePanelComponent } from '../attendance-panel/attendance-panel.component';
import { AttendanceHistoryComponent } from '../attendance-history/attendance-history.component';
import { UserService } from '../../../users/services/user.service';
import { AUTH_CONSTANTS } from '../../../../core/constants/auth.constants';
import {
  Employee,
  AREA_LABELS,
  SHIFT_LABELS,
  DOCUMENT_TYPE_LABELS,
  EmployeeArea,
  EmployeeShift,
  DocumentType
} from '../../models/employee.model';

/**
 * Componente de Detalle de Empleado
 * Sprint 4 - Gestión de Empleados
 */
@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    LoaderComponent, AttendancePanelComponent, AttendanceHistoryComponent
  ],
  templateUrl: './employee-detail.component.html',
  styles: [`
    .employee-avatar-lg {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: #198754;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: 700;
      flex-shrink: 0;
    }
  `]
})
export class EmployeeDetailComponent implements OnInit {

  employee: Employee | null = null;
  isLoading = false;
  isActionLoading = false;

  // Permisos
  canEdit: boolean;
  canDelete: boolean;
  isAdmin: boolean;

  // Link-user
  availableUsers: any[] = [];
  selectedLinkUserId: number | null = null;
  showLinkForm = false;
  isLoadingUsers = false;
  isLinking = false;

  // Modal confirmación
  showConfirmModal = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmDanger = false;
  confirmAction: (() => void) | null = null;

  private employeeId!: number;

  readonly AREA_LABELS          = AREA_LABELS;
  readonly SHIFT_LABELS         = SHIFT_LABELS;
  readonly DOCUMENT_TYPE_LABELS = DOCUMENT_TYPE_LABELS;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private employeeService: EmployeeService,
    private userService: UserService,
    private authService: AuthService,
    private alertService: AlertService
  ) {
    const { MODULES, ACTIONS } = AUTH_CONSTANTS;
    this.canEdit   = this.authService.hasPermission(MODULES.EMPLOYEES, ACTIONS.EDIT);
    this.canDelete = this.authService.hasPermission(MODULES.EMPLOYEES, ACTIONS.DELETE);
    this.isAdmin   = this.authService.isAdmin();
  }

  ngOnInit(): void {
    this.employeeId = Number(this.route.snapshot.params['id']);
    this.loadEmployee();
  }

  private loadEmployee(): void {
    this.isLoading = true;
    this.employeeService.getEmployeeById(this.employeeId).subscribe({
      next: response => {
        if (response.success && response.data) {
          this.employee = response.data;
        }
        this.isLoading = false;
      },
      error: () => {
        this.alertService.error('Error al cargar el empleado');
        this.isLoading = false;
        this.router.navigate(['/employees']);
      }
    });
  }

  // ─── Helpers visuales ────────────────────────────────────────────────────

  getInitials(): string {
    if (!this.employee) return 'E';
    return ((this.employee.firstName?.charAt(0) || '') + (this.employee.lastName?.charAt(0) || '')).toUpperCase() || 'E';
  }

  getAreaLabel():  string { return AREA_LABELS[this.employee?.area as EmployeeArea]          || ''; }
  getShiftLabel(): string { return SHIFT_LABELS[this.employee?.shift as EmployeeShift]        || ''; }
  getDocLabel():   string { return DOCUMENT_TYPE_LABELS[this.employee?.documentType as DocumentType] || ''; }

  getShiftBadgeClass(): string {
    const map: Record<EmployeeShift, string> = {
      morning:   'bg-info text-dark',
      afternoon: 'bg-warning text-dark',
      night:     'bg-dark text-white'
    };
    return map[this.employee?.shift as EmployeeShift] || 'bg-secondary';
  }

  // ─── Link / Unlink usuario ────────────────────────────────────────────────

  openLinkForm(): void {
    this.showLinkForm = true;
    this.selectedLinkUserId = null;
    this.isLoadingUsers = true;
    this.userService.getUsers({ limit: 100, isActive: true }).subscribe({
      next: response => {
        if (response.success && response.data) {
          this.availableUsers = response.data.users;
        }
        this.isLoadingUsers = false;
      },
      error: () => { this.isLoadingUsers = false; }
    });
  }

  closeLinkForm(): void {
    this.showLinkForm = false;
    this.selectedLinkUserId = null;
  }

  linkUser(): void {
    if (!this.selectedLinkUserId) {
      this.alertService.error('Seleccione un usuario para vincular');
      return;
    }
    this.isLinking = true;
    this.employeeService.linkUser(this.employeeId, Number(this.selectedLinkUserId)).subscribe({
      next: response => {
        if (response.success && response.data) {
          this.employee = response.data.employee;
          this.alertService.success(response.data.message);
          this.closeLinkForm();
        }
        this.isLinking = false;
      },
      error: error => {
        this.alertService.error(error?.message || 'Error al vincular usuario');
        this.isLinking = false;
      }
    });
  }

  confirmUnlinkUser(): void {
    this.openConfirm(
      'Desvincular Usuario',
      `¿Desea desvincular al usuario "${this.employee?.linkedUser?.username}" de este empleado?`,
      false,
      () => this.unlinkUser()
    );
  }

  private unlinkUser(): void {
    this.isLinking = true;
    this.employeeService.linkUser(this.employeeId, null).subscribe({
      next: response => {
        if (response.success && response.data) {
          this.employee = response.data.employee;
          this.alertService.success(response.data.message);
        }
        this.isLinking = false;
      },
      error: error => {
        this.alertService.error(error?.message || 'Error al desvincular usuario');
        this.isLinking = false;
      }
    });
  }

  // ─── Eliminar empleado ────────────────────────────────────────────────────

  confirmDelete(): void {
    this.openConfirm(
      'Eliminar Empleado',
      `¿Está seguro que desea eliminar a "${this.employee?.firstName} ${this.employee?.lastName}"? Esta acción no se puede deshacer.`,
      true,
      () => this.doDeleteEmployee()
    );
  }

  private doDeleteEmployee(): void {
    this.isActionLoading = true;
    this.employeeService.deleteEmployee(this.employeeId).subscribe({
      next: response => {
        if (response.success) {
          this.alertService.success('Empleado eliminado exitosamente');
          this.router.navigate(['/employees']);
        }
        this.isActionLoading = false;
      },
      error: () => {
        this.alertService.error('Error al eliminar el empleado');
        this.isActionLoading = false;
      }
    });
  }

  // ─── Modal helpers ────────────────────────────────────────────────────────

  private openConfirm(title: string, message: string, danger: boolean, action: () => void): void {
    this.confirmTitle   = title;
    this.confirmMessage = message;
    this.confirmDanger  = danger;
    this.confirmAction  = action;
    this.showConfirmModal = true;
  }

  executeConfirm(): void {
    if (this.confirmAction) this.confirmAction();
    this.closeConfirmModal();
  }

  closeConfirmModal(): void {
    this.showConfirmModal = false;
    this.confirmAction = null;
  }
}
