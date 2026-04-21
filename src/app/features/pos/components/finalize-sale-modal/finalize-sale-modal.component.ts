import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PosCustomer, PosPaymentMethod } from '../../models/pos.model';

@Component({
  selector: 'app-finalize-sale-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './finalize-sale-modal.component.html',
  styleUrl: './finalize-sale-modal.component.css'
})
export class FinalizeSaleModalComponent {
  @Input() visible = false;
  @Input() total = 0;
  @Input() customer: PosCustomer | null = null;

  @Output() canceled = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<{
    paymentMethod: PosPaymentMethod;
    amountReceived?: number;
    printTicket: boolean;
    sendEmail: boolean;
    payloadExtras?: Record<string, any>;
  }>();

  paymentMethod: PosPaymentMethod = 'efectivo';
  amountReceived = 0;
  printTicket = true;
  sendEmail = false;

  cardLast4 = '';
  cardAuth = '';

  transferRef = '';
  transferVerified = false;

  creditDays = 30;
  creditDueDate = '';

  ngOnChanges(): void {
    this.creditDueDate = this.calculateDueDate(this.creditDays);
  }

  get changeAmount(): number {
    return Number(Math.max(0, this.amountReceived - this.total).toFixed(2));
  }

  get isValid(): boolean {
    if (this.paymentMethod === 'efectivo') {
      return this.amountReceived >= this.total;
    }

    if (this.paymentMethod === 'tarjeta') {
      return this.cardLast4.trim().length === 4;
    }

    if (this.paymentMethod === 'transferencia') {
      return this.transferRef.trim().length > 0 && this.transferVerified;
    }

    if (this.paymentMethod === 'credito') {
      return !!this.customer;
    }

    return false;
  }

  addCash(amount: number): void {
    this.amountReceived = Number((this.amountReceived + amount).toFixed(2));
  }

  resetCashToTotal(): void {
    this.amountReceived = this.total;
  }

  calculateDueDate(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + Number(days || 0));
    return date.toISOString().slice(0, 10);
  }

  onCreditDaysChange(): void {
    this.creditDueDate = this.calculateDueDate(this.creditDays);
  }

  onCancel(): void {
    this.canceled.emit();
  }

  onConfirm(): void {
    if (!this.isValid) return;

    const payloadExtras: Record<string, any> = {};
    if (this.paymentMethod === 'tarjeta') {
      payloadExtras['cardLast4'] = this.cardLast4;
      payloadExtras['cardAuth'] = this.cardAuth;
    }
    if (this.paymentMethod === 'transferencia') {
      payloadExtras['transferRef'] = this.transferRef;
      payloadExtras['transferVerified'] = this.transferVerified;
    }
    if (this.paymentMethod === 'credito') {
      payloadExtras['creditDays'] = this.creditDays;
      payloadExtras['creditDueDate'] = this.creditDueDate;
    }

    this.confirmed.emit({
      paymentMethod: this.paymentMethod,
      amountReceived: this.paymentMethod === 'efectivo' ? this.amountReceived : this.total,
      printTicket: this.printTicket,
      sendEmail: this.sendEmail,
      payloadExtras
    });
  }
}
