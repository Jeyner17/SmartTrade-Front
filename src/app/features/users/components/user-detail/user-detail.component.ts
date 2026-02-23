import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';

import { UserService } from '../../services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import { AlertService } from '../../../../core/services/alert.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { SessionListComponent } from '../session-list/session-list.component';
import { AUTH_CONSTANTS } from '../../../../core/constants/auth.constants';
import { User, UserSession, UserStatus } from '../../models/user.model';

/**
 * Componente de Detalle de Usuario
 * Sprint 3 - Gestión de Usuarios
 */
@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, LoaderComponent, SessionListComponent],
  templateUrl: './user-detail.component.html',
  styles: [`
    .user-avatar-lg {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: #0d6efd;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: 700;
      flex-shrink: 0;
    }
    .info-item { margin-bottom: 0.75rem; }
    .info-label { font-size: 0.8rem; text-transform: uppercase; letter-spacing: .05em; }
  `]
})
export class UserDetailComponent implements OnInit {

  user: User | null = null;
  sessions: UserSession[] = [];

  isLoading = false;
  isActionLoading = false;
  sessionsLoading = false;

  // Permisos
  canEdit: boolean;
  canDelete: boolean;
  isAdmin: boolean;

  // Modal confirmación
  showConfirmModal = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmDanger = false;
  confirmAction: (() => void) | null = null;

  // Modal contraseña temporal
  showPasswordModal = false;
  temporaryPassword = '';

  private userId!: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private authService: AuthService,
    private alertService: AlertService
  ) {
    const { MODULES, ACTIONS } = AUTH_CONSTANTS;
    this.canEdit   = this.authService.hasPermission(MODULES.USERS, ACTIONS.EDIT);
    this.canDelete = this.authService.hasPermission(MODULES.USERS, ACTIONS.DELETE);
    this.isAdmin   = this.authService.isAdmin();
  }

  ngOnInit(): void {
    this.userId = Number(this.route.snapshot.params['id']);
    this.loadUser();
    if (this.isAdmin) this.loadSessions();
  }

  // ─── Carga de datos ──────────────────────────────────────────────────────

  private loadUser(): void {
    this.isLoading = true;
    this.userService.getUserById(this.userId).subscribe({
      next: response => {
        if (response.success && response.data) {
          this.user = response.data.user;
        }
        this.isLoading = false;
      },
      error: () => {
        this.alertService.error('Error al cargar el usuario');
        this.isLoading = false;
        this.router.navigate(['/users']);
      }
    });
  }

  loadSessions(): void {
    this.sessionsLoading = true;
    this.userService.getUserSessions(this.userId).subscribe({
      next: response => {
        if (response.success && response.data) {
          this.sessions = response.data.sessions;
        }
        this.sessionsLoading = false;
      },
      error: () => { this.sessionsLoading = false; }
    });
  }

  // ─── Helpers visuales ────────────────────────────────────────────────────

  getUserInitials(): string {
    if (!this.user) return 'U';
    return ((this.user.firstName?.charAt(0) || '') + (this.user.lastName?.charAt(0) || '')).toUpperCase() || 'U';
  }

  getStatusBadge(): { text: string; cssClass: string } {
    if (!this.user) return { text: '', cssClass: '' };
    if (this.isLocked()) return { text: 'Bloqueado', cssClass: 'badge bg-warning text-dark fs-6' };
    return this.user.isActive
      ? { text: 'Activo',   cssClass: 'badge bg-success fs-6' }
      : { text: 'Inactivo', cssClass: 'badge bg-danger fs-6'  };
  }

  isLocked(): boolean {
    return !!(this.user?.lockUntil && new Date(this.user.lockUntil) > new Date());
  }

  // ─── Confirmaciones ───────────────────────────────────────────────────────

  confirmStatusChange(): void {
    if (!this.user) return;
    const action = this.user.isActive ? 'desactivar' : 'activar';
    this.openConfirm(
      'Cambiar Estado',
      `¿Desea ${action} la cuenta de "${this.user.fullName || this.user.username}"?`,
      false,
      () => this.changeStatus(this.user!.isActive ? 'inactive' : 'active')
    );
  }

  confirmUnlock(): void {
    this.openConfirm(
      'Desbloquear Usuario',
      '¿Desea desbloquear la cuenta de este usuario?',
      false,
      () => this.changeStatus('unlock')
    );
  }

  confirmResetPassword(): void {
    this.openConfirm(
      'Resetear Contraseña',
      'Se generará una nueva contraseña temporal. ¿Desea continuar?',
      false,
      () => this.doResetPassword()
    );
  }

  confirmLogoutAll(): void {
    this.openConfirm(
      'Cerrar Todas las Sesiones',
      '¿Desea cerrar todas las sesiones activas de este usuario?',
      false,
      () => this.doLogoutAll()
    );
  }

  confirmDelete(): void {
    this.openConfirm(
      'Eliminar Usuario',
      `¿Está seguro que desea eliminar a "${this.user?.fullName || this.user?.username}"? Esta acción no se puede deshacer.`,
      true,
      () => this.doDeleteUser()
    );
  }

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

  private changeStatus(status: UserStatus): void {
    this.isActionLoading = true;
    this.userService.changeStatus(this.userId, status).subscribe({
      next: response => {
        if (response.success && response.data) {
          this.user = response.data.user;
          this.alertService.success('Estado actualizado exitosamente');
        }
        this.isActionLoading = false;
      },
      error: () => {
        this.alertService.error('Error al cambiar el estado');
        this.isActionLoading = false;
      }
    });
  }

  private doResetPassword(): void {
    this.isActionLoading = true;
    this.userService.resetPassword(this.userId).subscribe({
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

  private doLogoutAll(): void {
    this.isActionLoading = true;
    this.userService.logoutAllSessions(this.userId).subscribe({
      next: response => {
        if (response.success) {
          this.sessions = [];
          this.alertService.success('Sesiones cerradas exitosamente');
        }
        this.isActionLoading = false;
      },
      error: () => {
        this.alertService.error('Error al cerrar las sesiones');
        this.isActionLoading = false;
      }
    });
  }

  private doDeleteUser(): void {
    this.isActionLoading = true;
    this.userService.deleteUser(this.userId).subscribe({
      next: response => {
        if (response.success) {
          this.alertService.success('Usuario eliminado exitosamente');
          this.router.navigate(['/users']);
        }
        this.isActionLoading = false;
      },
      error: () => {
        this.alertService.error('Error al eliminar el usuario');
        this.isActionLoading = false;
      }
    });
  }

  // Handler del EventEmitter del SessionListComponent
  onLogoutAll(): void {
    this.confirmLogoutAll();
  }
}
