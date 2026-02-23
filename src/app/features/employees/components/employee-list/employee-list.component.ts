import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { EmployeeService } from '../../services/employee.service';
import { AuthService } from '../../../../core/services/auth.service';
import { AlertService } from '../../../../core/services/alert.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { AUTH_CONSTANTS } from '../../../../core/constants/auth.constants';
import {
  Employee,
  EmployeeFilters,
  EmployeeArea,
  EmployeeShift,
  AREA_LABELS,
  SHIFT_LABELS
} from '../../models/employee.model';

/**
 * Componente de Lista de Empleados
 * Sprint 4 - Gestión de Empleados
 */
@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, LoaderComponent],
  templateUrl: './employee-list.component.html',
  styles: [`
    .employee-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #198754;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
      flex-shrink: 0;
    }
  `]
})
export class EmployeeListComponent implements OnInit, OnDestroy {

  employees: Employee[] = [];
  pagination: any = null;

  isLoading = false;
  isActionLoading = false;

  // Filtros — default: solo activos
  filters: EmployeeFilters = { page: 1, limit: 10, isActive: true };
  searchTerm    = '';
  selectedArea  = '';
  selectedShift = '';
  selectedStatus = 'true';

  // Opciones para selects
  areaOptions  = Object.entries(AREA_LABELS).map(([value, label]) => ({ value, label }));
  shiftOptions = Object.entries(SHIFT_LABELS).map(([value, label]) => ({ value, label }));

  // Permisos
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;

  // Modal confirmación
  showConfirmModal = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmAction: (() => void) | null = null;

  readonly AREA_LABELS  = AREA_LABELS;
  readonly SHIFT_LABELS = SHIFT_LABELS;

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private employeeService: EmployeeService,
    private authService: AuthService,
    private alertService: AlertService
  ) {
    const { MODULES, ACTIONS } = AUTH_CONSTANTS;
    this.canCreate = this.authService.hasPermission(MODULES.EMPLOYEES, ACTIONS.CREATE);
    this.canEdit   = this.authService.hasPermission(MODULES.EMPLOYEES, ACTIONS.EDIT);
    this.canDelete = this.authService.hasPermission(MODULES.EMPLOYEES, ACTIONS.DELETE);
  }

  ngOnInit(): void {
    this.setupSearch();
    this.loadEmployees();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearch(): void {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      this.filters.search = term || undefined;
      this.filters.page = 1;
      this.loadEmployees();
    });
  }

  loadEmployees(): void {
    this.isLoading = true;
    this.employeeService.getEmployees({ ...this.filters }).subscribe({
      next: response => {
        if (response.success && response.data) {
          this.employees  = response.data.employees;
          this.pagination = response.data.pagination;
        }
        this.isLoading = false;
      },
      error: () => {
        this.alertService.error('Error al cargar los empleados');
        this.isLoading = false;
      }
    });
  }

  onSearch(term: string): void { this.searchSubject.next(term); }

  onAreaFilter(): void {
    this.filters.area = (this.selectedArea as EmployeeArea) || undefined;
    this.filters.page = 1;
    this.loadEmployees();
  }

  onShiftFilter(): void {
    this.filters.shift = (this.selectedShift as EmployeeShift) || undefined;
    this.filters.page = 1;
    this.loadEmployees();
  }

  onStatusFilter(): void {
    if      (this.selectedStatus === 'true')  this.filters.isActive = true;
    else if (this.selectedStatus === 'false') this.filters.isActive = false;
    else                                      this.filters.isActive = undefined;
    this.filters.page = 1;
    this.loadEmployees();
  }

  clearFilters(): void {
    this.searchTerm    = '';
    this.selectedArea  = '';
    this.selectedShift = '';
    this.selectedStatus = 'true';
    this.filters = { page: 1, limit: 10, isActive: true };
    this.loadEmployees();
  }

  onPageChange(page: number): void {
    this.filters.page = page;
    this.loadEmployees();
  }

  // ─── Helpers visuales ────────────────────────────────────────────────────

  getInitials(emp: Employee): string {
    return ((emp.firstName?.charAt(0) || '') + (emp.lastName?.charAt(0) || '')).toUpperCase() || 'E';
  }

  getAreaLabel(area: string): string {
    return AREA_LABELS[area as EmployeeArea] || area;
  }

  getShiftLabel(shift: string): string {
    return SHIFT_LABELS[shift as EmployeeShift] || shift;
  }

  getShiftBadgeClass(shift: EmployeeShift): string {
    const map: Record<EmployeeShift, string> = {
      morning:   'bg-info text-dark',
      afternoon: 'bg-warning text-dark',
      night:     'bg-dark text-white'
    };
    return map[shift] || 'bg-secondary';
  }

  // ─── Confirmación de eliminación ─────────────────────────────────────────

  confirmDelete(employee: Employee): void {
    this.confirmTitle   = 'Eliminar Empleado';
    this.confirmMessage = `¿Está seguro que desea eliminar a "${employee.firstName} ${employee.lastName}"?`;
    this.confirmAction  = () => this.deleteEmployee(employee.id);
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

  private deleteEmployee(id: number): void {
    this.isActionLoading = true;
    this.employeeService.deleteEmployee(id).subscribe({
      next: response => {
        if (response.success) {
          this.alertService.success('Empleado eliminado exitosamente');
          this.loadEmployees();
        }
        this.isActionLoading = false;
      },
      error: () => {
        this.alertService.error('Error al eliminar el empleado');
        this.isActionLoading = false;
      }
    });
  }

  // ─── Paginación ──────────────────────────────────────────────────────────

  getPages(): number[] {
    if (!this.pagination) return [];
    return Array.from({ length: this.pagination.pages }, (_, i) => i + 1);
  }

  getFirstItem(): number {
    if (!this.pagination) return 0;
    return (this.pagination.page - 1) * this.pagination.limit + 1;
  }

  getLastItem(): number {
    if (!this.pagination) return 0;
    return Math.min(this.pagination.page * this.pagination.limit, this.pagination.total);
  }
}
