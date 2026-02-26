import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { UserService } from '../../services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import { AlertService } from '../../../../core/services/alert.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { AUTH_CONSTANTS } from '../../../../core/constants/auth.constants';
import { User, Role, UserFilters, PaginationMeta, UserStatus } from '../../models/user.model';

/**
 * Componente de Lista de Usuarios
 * Sprint 3 - Gestión de Usuarios
 */
@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, LoaderComponent],
  templateUrl: './user-list.component.html',
  styles: [`
    .user-avatar-table {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #0d6efd;
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
export class UserListComponent implements OnInit, OnDestroy {

  users: User[] = [];
  roles: Role[] = [];
  pagination: PaginationMeta | null = null;

  isLoading = false;
  isActionLoading = false;

  // Filtros
  filters: UserFilters = { page: 1, limit: 10 };
  searchTerm = '';
  selectedRole = '';
  selectedStatus = '';

  // Modal confirmación
  showConfirmModal = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmAction: (() => void) | null = null;

  // Modal contraseña temporal
  showPasswordModal = false;
  temporaryPassword = '';

  // Permisos
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  isAdmin: boolean;

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private alertService: AlertService
  ) {
    const { MODULES, ACTIONS } = AUTH_CONSTANTS;
    this.canCreate = this.authService.hasPermission(MODULES.USERS, ACTIONS.CREATE);
    this.canEdit   = this.authService.hasPermission(MODULES.USERS, ACTIONS.EDIT);
    this.canDelete = this.authService.hasPermission(MODULES.USERS, ACTIONS.DELETE);
    this.isAdmin   = this.authService.isAdmin();
  }

  ngOnInit(): void {
    this.setupSearch();
    this.loadRoles();
    this.loadUsers();
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
      this.loadUsers();
    });
  }

  private loadRoles(): void {
    this.userService.getRoles().subscribe({
      next: response => {
        if (response.success && response.data) {
          this.roles = response.data;
        }
      },
      error: () => {}
    });
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getUsers({ ...this.filters }).subscribe({
      next: response => {
        if (response.success && response.data) {
          this.users = response.data.users;
          this.pagination = response.data.pagination;
        }
        this.isLoading = false;
      },
      error: () => {
        this.alertService.error('Error al cargar los usuarios');
        this.isLoading = false;
      }
    });
  }

  onSearch(term: string): void {
    this.searchSubject.next(term);
  }

  onRoleFilter(): void {
    this.filters.roleId = this.selectedRole ? Number(this.selectedRole) : undefined;
    this.filters.page = 1;
    this.loadUsers();
  }

  onStatusFilter(): void {
    if (this.selectedStatus === 'true')       this.filters.isActive = true;
    else if (this.selectedStatus === 'false') this.filters.isActive = false;
    else                                      this.filters.isActive = undefined;
    this.filters.page = 1;
    this.loadUsers();
  }

  onPageChange(page: number): void {
    this.filters.page = page;
    this.loadUsers();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedRole = '';
    this.selectedStatus = '';
    this.filters = { page: 1, limit: 10 };
    this.loadUsers();
  }

  // ─── Badges ──────────────────────────────────────────────────────────────
  getStatusBadge(user: User): { text: string; cssClass: string } {
    if (user.lockUntil && new Date(user.lockUntil) > new Date()) {
      return { text: 'Bloqueado', cssClass: 'badge bg-warning text-dark' };
    }
    return user.isActive
      ? { text: 'Activo',   cssClass: 'badge bg-success' }
      : { text: 'Inactivo', cssClass: 'badge bg-danger'  };
  }

  getUserInitials(user: User): string {
    return ((user.firstName?.charAt(0) || '') + (user.lastName?.charAt(0) || '')).toUpperCase() || 'U';
  }

  // ─── Confirmaciones ───────────────────────────────────────────────────────
  confirmDelete(user: User): void {
    this.confirmTitle   = 'Eliminar Usuario';
    this.confirmMessage = `¿Está seguro que desea eliminar al usuario "${user.fullName || user.username}"? Esta acción no se puede deshacer.`;
    this.confirmAction  = () => this.deleteUser(user.id);
    this.showConfirmModal = true;
  }

  confirmStatusChange(user: User): void {
    const action = user.isActive ? 'desactivar' : 'activar';
    this.confirmTitle   = 'Cambiar Estado';
    this.confirmMessage = `¿Desea ${action} al usuario "${user.fullName || user.username}"?`;
    this.confirmAction  = () => this.changeStatus(user.id, user.isActive ? 'inactive' : 'active');
    this.showConfirmModal = true;
  }

  confirmResetPassword(user: User): void {
    this.confirmTitle   = 'Resetear Contraseña';
    this.confirmMessage = `¿Desea resetear la contraseña de "${user.fullName || user.username}"? Se generará una contraseña temporal.`;
    this.confirmAction  = () => this.resetPassword(user.id);
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

  closePasswordModal(): void {
    this.showPasswordModal = false;
    this.temporaryPassword = '';
  }

  copyPassword(): void {
    navigator.clipboard.writeText(this.temporaryPassword).then(() => {
      this.alertService.success('Contraseña copiada al portapapeles');
    });
  }

  // ─── Acciones ─────────────────────────────────────────────────────────────
  private deleteUser(id: number): void {
    this.isActionLoading = true;
    this.userService.deleteUser(id).subscribe({
      next: response => {
        if (response.success) {
          this.alertService.success('Usuario eliminado exitosamente');
          this.loadUsers();
        }
        this.isActionLoading = false;
      },
      error: () => {
        this.alertService.error('Error al eliminar el usuario');
        this.isActionLoading = false;
      }
    });
  }

  private changeStatus(id: number, status: UserStatus): void {
    this.isActionLoading = true;
    this.userService.changeStatus(id, status).subscribe({
      next: response => {
        if (response.success) {
          this.alertService.success('Estado actualizado exitosamente');
          this.loadUsers();
        }
        this.isActionLoading = false;
      },
      error: () => {
        this.alertService.error('Error al cambiar el estado');
        this.isActionLoading = false;
      }
    });
  }

  private resetPassword(id: number): void {
    this.isActionLoading = true;
    this.userService.resetPassword(id).subscribe({
      next: response => {
        if (response.success && response.data) {
          this.temporaryPassword = response.data.temporaryPassword || '';
          this.showPasswordModal = true;
        }
        this.isActionLoading = false;
      },
      error: () => {
        this.alertService.error('Error al resetear la contraseña');
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
    return Math.min(
      this.pagination.page * this.pagination.limit,
      this.pagination.total
    );
  }
}
