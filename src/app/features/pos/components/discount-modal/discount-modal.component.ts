import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

export type DiscountModalType = 'percentage' | 'fixed';

@Component({
  selector: 'app-discount-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './discount-modal.component.html',
  styleUrl: './discount-modal.component.css'
})
export class DiscountModalComponent {
  @Input() visible = false;
  @Input() currentTotal = 0;
  @Input() maxPercentage = 20;

  @Output() applied = new EventEmitter<{ discountType: 'percentage' | 'fixed'; value: number; reason: string; observations?: string }>();
  @Output() canceled = new EventEmitter<void>();

  discountType: DiscountModalType = 'percentage';
  value = 0;
  reason = 'Promoción';
  observations = '';

  get discountAmount(): number {
    if (this.discountType === 'percentage') {
      return Number((this.currentTotal * (this.value / 100)).toFixed(2));
    }
    return Number(Math.min(this.currentTotal, this.value).toFixed(2));
  }

  get newTotal(): number {
    return Number(Math.max(0, this.currentTotal - this.discountAmount).toFixed(2));
  }

  get isInvalid(): boolean {
    if (this.value < 0) return true;
    if (this.discountType === 'percentage' && this.value > this.maxPercentage) return true;
    if (this.discountType === 'fixed' && this.value > this.currentTotal) return true;
    return false;
  }

  onCancel(): void {
    this.canceled.emit();
  }

  onApply(): void {
    if (this.isInvalid) return;

    this.applied.emit({
      discountType: this.discountType,
      value: Number(this.value || 0),
      reason: this.reason,
      observations: this.observations?.trim() || undefined
    });
  }
}
