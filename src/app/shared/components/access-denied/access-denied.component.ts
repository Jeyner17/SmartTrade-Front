import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/auth.model';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="access-denied-container">
      <div class="access-denied-card">
        <i class="bi bi-shield-exclamation text-danger" style="font-size: 80px;"></i>
        <h1 class="mt-4">Acceso Denegado</h1>
        <p class="text-muted">No tiene permisos para acceder a esta sección.</p>
        
        <div class="mt-4">
          <button class="btn btn-primary me-2" (click)="goBack()">
            <i class="bi bi-arrow-left me-2"></i>
            Volver
          </button>
          <button class="btn btn-outline-secondary" (click)="goHome()">
            <i class="bi bi-house me-2"></i>
            Ir al Inicio
          </button>
        </div>

        <div class="mt-4 text-muted small" *ngIf="currentUser">
          <p>Usuario: {{ currentUser.username }}</p>
          <p>Rol: {{ currentUser.role.name }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .access-denied-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8f9fa;
    }

    .access-denied-card {
      text-align: center;
      padding: 40px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      max-width: 500px;
    }
  `]
})
export class AccessDeniedComponent {
  currentUser: User | null = null;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    // Inicializar currentUser DESPUÉS de que authService esté disponible
    this.currentUser = this.authService.getCurrentUser();
  }

  goBack(): void {
    window.history.back();
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}