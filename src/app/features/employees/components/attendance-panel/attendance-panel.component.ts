import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EmployeeService } from '../../services/employee.service';
import { AuthService } from '../../../../core/services/auth.service';
import { AlertService } from '../../../../core/services/alert.service';
import { AUTH_CONSTANTS } from '../../../../core/constants/auth.constants';
import { TodayAttendance, AttendanceStatus } from '../../models/employee.model';

/**
 * Componente Panel de Asistencia del Día
 * Sprint 4 - Gestión de Empleados
 */
@Component({
  selector: 'app-attendance-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './attendance-panel.component.html',
  styles: []
})
export class AttendancePanelComponent implements OnInit {

  @Input() employeeId!: number;

  todayStatus: TodayAttendance | null = null;
  isLoading = false;
  isRecording = false;
  confirmingAction = false;
  notes = '';

  canEdit: boolean;

  constructor(
    private employeeService: EmployeeService,
    private authService: AuthService,
    private alertService: AlertService
  ) {
    this.canEdit = this.authService.hasPermission(
      AUTH_CONSTANTS.MODULES.EMPLOYEES,
      AUTH_CONSTANTS.ACTIONS.EDIT
    );
  }

  ngOnInit(): void {
    this.loadTodayStatus();
  }

  loadTodayStatus(): void {
    this.isLoading = true;
    this.employeeService.getTodayAttendance(this.employeeId).subscribe({
      next: response => {
        if (response.success && response.data) {
          this.todayStatus = response.data;
        }
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  showConfirmForm(): void {
    this.notes = '';
    this.confirmingAction = true;
  }

  cancelConfirm(): void {
    this.confirmingAction = false;
    this.notes = '';
  }

  confirmAttendance(): void {
    if (!this.todayStatus?.nextAction) return;
    const type = this.todayStatus.nextAction;

    this.isRecording = true;
    this.confirmingAction = false;

    this.employeeService.recordAttendance(this.employeeId, type, this.notes).subscribe({
      next: response => {
        if (response.success) {
          const label = type === 'entry' ? 'Entrada' : 'Salida';
          this.alertService.success(`${label} registrada exitosamente`);
          this.loadTodayStatus();
        }
        this.isRecording = false;
      },
      error: error => {
        this.alertService.error(error?.message || 'Error al registrar asistencia');
        this.isRecording = false;
      }
    });
  }

  // ─── Helpers visuales ────────────────────────────────────────────────────

  getStatusConfig(): { headerClass: string; icon: string; label: string; description: string } {
    const status = this.todayStatus?.status;
    switch (status) {
      case 'absent':
        return {
          headerClass: 'bg-secondary text-white',
          icon: 'bi-clock',
          label: 'Sin Registro',
          description: 'El empleado no ha marcado entrada hoy'
        };
      case 'present':
        return {
          headerClass: 'bg-warning',
          icon: 'bi-play-circle-fill',
          label: 'En Turno',
          description: 'Entrada registrada — pendiente marcar salida'
        };
      case 'completed':
        return {
          headerClass: 'bg-success text-white',
          icon: 'bi-check-circle-fill',
          label: 'Completado',
          description: 'Jornada laboral completada'
        };
      default:
        return {
          headerClass: 'bg-light',
          icon: 'bi-dash-circle',
          label: 'Cargando...',
          description: ''
        };
    }
  }

  formatTime(isoString: string | null): string {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  }

  getActionLabel(): string {
    return this.todayStatus?.nextAction === 'entry' ? 'Marcar Entrada' : 'Marcar Salida';
  }

  getActionClass(): string {
    return this.todayStatus?.nextAction === 'entry' ? 'btn-success' : 'btn-warning';
  }

  getActionIcon(): string {
    return this.todayStatus?.nextAction === 'entry' ? 'bi-box-arrow-in-right' : 'bi-box-arrow-right';
  }
}
