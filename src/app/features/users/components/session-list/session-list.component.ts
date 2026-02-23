import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserSession } from '../../models/user.model';

/**
 * Componente de Lista de Sesiones Activas
 * Sprint 3 - Gestión de Usuarios
 * Usado dentro de UserDetailComponent
 */
@Component({
  selector: 'app-session-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './session-list.component.html',
  styles: []
})
export class SessionListComponent {

  @Input() sessions: UserSession[] = [];
  @Input() isAdmin = false;
  @Input() isLoading = false;
  @Output() logoutAll = new EventEmitter<void>();

  onLogoutAll(): void {
    this.logoutAll.emit();
  }

  isExpired(session: UserSession): boolean {
    return new Date(session.expiresAt) < new Date();
  }

  getBrowserName(userAgent: string): string {
    if (!userAgent) return 'Desconocido';
    if (userAgent.includes('Edg'))     return 'Edge';
    if (userAgent.includes('Chrome'))  return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari'))  return 'Safari';
    return 'Otro';
  }

  getBrowserIcon(userAgent: string): string {
    if (!userAgent) return 'bi-globe';
    if (userAgent.includes('Edg'))     return 'bi-browser-edge';
    if (userAgent.includes('Chrome'))  return 'bi-browser-chrome';
    if (userAgent.includes('Firefox')) return 'bi-browser-firefox';
    if (userAgent.includes('Safari'))  return 'bi-browser-safari';
    return 'bi-globe';
  }

  getDeviceType(userAgent: string): string {
    if (!userAgent) return 'Desconocido';
    if (/Mobile|Android|iPhone/i.test(userAgent)) return 'Móvil';
    if (/Tablet|iPad/i.test(userAgent))           return 'Tablet';
    return 'Escritorio';
  }

  getDeviceIcon(userAgent: string): string {
    if (!userAgent) return 'bi-question-circle';
    if (/Mobile|Android|iPhone/i.test(userAgent)) return 'bi-phone';
    if (/Tablet|iPad/i.test(userAgent))           return 'bi-tablet';
    return 'bi-monitor';
  }

  getActiveSessions(): UserSession[] {
    return this.sessions.filter(s => s.isActive && !this.isExpired(s));
  }
}
