import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PurchaseOrder, CANCEL_REASON_OPTIONS } from '../../models/purchase.model';

@Component({
  selector: 'app-purchase-cancel-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  templateUrl: './purchase-cancel-modal.component.html',
  styleUrl: './purchase-cancel-modal.component.css'
})
export class PurchaseCancelModalComponent {
  @Input() visible = false;
  @Input() order: PurchaseOrder | null = null;
  @Input() isSaving = false;

  @Output() closed = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<{ reason: string }>();

  readonly reasonOptions = CANCEL_REASON_OPTIONS;

  selectedReason = '';
  details = '';

  onClose(): void {
    this.closed.emit();
  }

  onConfirm(): void {
    if (!this.selectedReason) {
      return;
    }

    const reason = this.details.trim()
      ? `${this.selectedReason}: ${this.details.trim()}`
      : this.selectedReason;

    this.confirmed.emit({ reason });
  }
}
