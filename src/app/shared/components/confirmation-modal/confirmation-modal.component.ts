import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationConfig } from '../../../core/services/confirmation.service';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Backdrop -->
    <div class="confirm-backdrop" (click)="onCancel()"></div>

    <!-- Dialog -->
    <div class="confirm-dialog" [class]="'confirm-dialog--' + (config.type || 'warning')" role="dialog">

      <!-- Ícono -->
      <div class="confirm-icon-wrap">
        <i class="bi" [ngClass]="{
          'bi-exclamation-circle-fill text-danger':  config.type === 'danger',
          'bi-exclamation-triangle-fill text-warning': config.type === 'warning' || !config.type,
          'bi-info-circle-fill text-primary':        config.type === 'info'
        }"></i>
      </div>

      <!-- Título -->
      <h5 class="confirm-title">{{ config.title }}</h5>

      <!-- Mensaje -->
      <p class="confirm-message">{{ config.message }}</p>

      <!-- Acciones -->
      <div class="confirm-actions">
        <button class="btn btn-outline-secondary" type="button" (click)="onCancel()">
          {{ config.cancelText || 'Cancelar' }}
        </button>
        <button class="btn" type="button"
          [ngClass]="{
            'btn-danger':   config.type === 'danger',
            'btn-warning':  config.type === 'warning' || !config.type,
            'btn-primary':  config.type === 'info'
          }"
          (click)="onConfirm()">
          {{ config.confirmText || 'Confirmar' }}
        </button>
      </div>

    </div>
  `,
  styles: [`
    .confirm-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.45);
      z-index: 1055;
      animation: fadeIn 0.15s ease;
    }

    .confirm-dialog {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 1056;
      background: #fff;
      border-radius: 12px;
      padding: 2rem;
      width: 100%;
      max-width: 400px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
      animation: slideIn 0.2s ease;
    }

    .confirm-icon-wrap {
      margin-bottom: 1rem;
    }

    .confirm-icon-wrap .bi {
      font-size: 3rem;
    }

    .confirm-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: #1a202c;
      margin-bottom: 0.5rem;
    }

    .confirm-message {
      font-size: 0.95rem;
      color: #718096;
      margin-bottom: 1.5rem;
      line-height: 1.5;
    }

    .confirm-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
    }

    .confirm-actions .btn {
      min-width: 110px;
      font-weight: 500;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translate(-50%, -54%); }
      to   { opacity: 1; transform: translate(-50%, -50%); }
    }
  `]
})
export class ConfirmationModalComponent {
  @Input() config!: ConfirmationConfig;
  @Output() result = new EventEmitter<boolean>();

  onConfirm(): void { this.result.emit(true);  }
  onCancel():  void { this.result.emit(false); }
}
