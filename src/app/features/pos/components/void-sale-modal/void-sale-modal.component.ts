import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PosSale } from '../../models/pos.model';

@Component({
  selector: 'app-void-sale-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './void-sale-modal.component.html',
  styleUrl: './void-sale-modal.component.css'
})
export class VoidSaleModalComponent {
  @Input() visible = false;
  @Input() sale: PosSale | null = null;
  @Input() requireSupervisorPassword = false;

  @Output() canceled = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<{ reason: string; details: string; supervisorPassword?: string }>();

  reason = 'Error del cajero';
  details = '';
  supervisorPassword = '';

  get canSubmit(): boolean {
    if (!this.details.trim()) return false;
    if (this.requireSupervisorPassword && !this.supervisorPassword.trim()) return false;
    return true;
  }

  onCancel(): void {
    this.canceled.emit();
  }

  onConfirm(): void {
    if (!this.canSubmit) return;
    const composedReason = `${this.reason}: ${this.details.trim()}`;
    this.confirmed.emit({
      reason: composedReason,
      details: this.details.trim(),
      supervisorPassword: this.supervisorPassword.trim() || undefined
    });
  }
}
