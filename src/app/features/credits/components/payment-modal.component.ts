import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CreditsService } from '../services/credits.service';

@Component({
  selector: 'app-payment-modal',
  templateUrl: './payment-modal.component.html',
  styleUrls: ['./payment-modal.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class PaymentModalComponent implements OnInit, OnChanges {
  @Input() credit: any = null;
  @Output() closed = new EventEmitter<void>();
  @Output() paymentRegistered = new EventEmitter<void>();

  paymentForm!: FormGroup;
  loading = false;
  error: string | null = null;
  success: string | null = null;
  paymentMethods = ['efectivo', 'transferencia', 'tarjeta'];

  constructor(private fb: FormBuilder, private creditsService: CreditsService) {}

  ngOnInit(): void {
    this.buildForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['credit'] && this.credit) {
      // Asegurar que credit siempre tenga lateInterest
      this.credit.lateInterest = this.credit.lateInterest || 0;
      this.credit.outstandingBalance = Number(this.credit.outstandingBalance) || 0;
      
      if (!changes['credit'].firstChange) {
        this.updateForm();
      } else {
        // Primera carga: inicializar con saldo total
        this.updateAmount();
      }
    }
  }

  buildForm(): void {
    this.paymentForm = this.fb.group({
      paymentType: ['total', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      paymentMethod: ['efectivo', Validators.required],
      paymentDate: [new Date().toISOString().substring(0, 10), Validators.required],
      notes: [''],
      printReceipt: [false]
    });

    this.paymentForm.get('paymentType')?.valueChanges.subscribe(() => {
      setTimeout(() => this.updateAmount(), 0);
    });
  }

  updateForm(): void {
    if (this.credit) {
      this.credit.lateInterest = this.credit.lateInterest || 0;
      this.credit.outstandingBalance = Number(this.credit.outstandingBalance) || 0;
      this.updateAmount();
    }
  }

  updateAmount(): void {
    if (!this.credit) return;
    
    if (this.paymentForm.value.paymentType === 'total') {
      const totalAmount = Number(this.credit.outstandingBalance || 0) + Number(this.credit.lateInterest || 0);
      this.paymentForm.patchValue({
        amount: totalAmount
      }, { emitEvent: false });
    }
  }

  calculateNewBalance(): number {
    if (!this.credit) return 0;
    const currentAmount = this.paymentForm?.value?.amount || 0;
    const current = Number(this.credit.outstandingBalance || 0) + Number(this.credit.lateInterest || 0);
    return Math.max(0, current - currentAmount);
  }

  validateAmount(): string | null {
    if (!this.credit) return 'Datos del crédito no disponibles';
    
    const amount = this.paymentForm?.value?.amount || 0;
    const maxAmount = Number(this.credit.outstandingBalance || 0) + Number(this.credit.lateInterest || 0);
    
    if (amount > maxAmount) {
      return `El monto no puede ser mayor a $${maxAmount.toFixed(2)}`;
    }
    if (amount <= 0) {
      return 'El monto debe ser mayor a 0';
    }
    return null;
  }

  onSubmit(): void {
    this.error = null;
    this.success = null;

    const amountError = this.validateAmount();
    if (amountError) {
      this.error = amountError;
      return;
    }

    if (this.paymentForm.invalid) return;

    this.loading = true;
    const formValue = this.paymentForm.value;
    const paymentData = {
      amountPaid: formValue.amount,
      paymentMethod: formValue.paymentMethod,
      paymentDate: formValue.paymentDate,
      notes: formValue.notes
    };

    this.creditsService.registerPayment(this.credit.id, paymentData).subscribe({
      next: () => {
        this.loading = false;
        this.success = 'Pago registrado exitosamente';
        setTimeout(() => {
          this.paymentRegistered.emit();
          this.onCancel();
        }, 1500);
      },
      error: err => {
        this.loading = false;
        this.error = err.error?.message || 'Error al registrar pago';
      }
    });
  }

  onCancel(): void {
    this.paymentForm.reset();
    this.error = null;
    this.success = null;
    this.closed.emit();
  }
}
