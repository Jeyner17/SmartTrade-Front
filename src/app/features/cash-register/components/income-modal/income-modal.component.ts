import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { CashRegisterService } from '../../services/cash-register.service';
import { AlertService } from '../../../../core/services/alert.service';
import { RegisterIncomeDto, INCOME_CONCEPTS, PAYMENT_METHOD_LABELS, PaymentMethod } from '../../models/cash-register.model';

/**
 * Modal 3: Registrar Ingreso Adicional
 */
@Component({
  selector: 'app-income-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './income-modal.component.html',
  styleUrl: './income-modal.component.css'
})
export class IncomeModalComponent {

  @Input() sessionId = 0;
  @Input() currentExpectedCash = 0;
  @Output() closed = new EventEmitter<void>();

  form: FormGroup;
  isLoading = false;

  readonly concepts        = INCOME_CONCEPTS;
  readonly paymentMethods  = Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][];

  get newTotal(): number {
    return this.currentExpectedCash + (this.form.value.amount || 0);
  }

  get showCustomConcept(): boolean {
    return this.form.value.concept === 'other';
  }

  constructor(
    private fb: FormBuilder,
    private cashService: CashRegisterService,
    private alertService: AlertService
  ) {
    this.form = this.fb.group({
      amount:        [null, [Validators.required, Validators.min(0.01)]],
      concept:       ['credit_payment', Validators.required],
      customConcept: [''],
      paymentMethod: ['cash', Validators.required],
      observations:  ['']
    });
  }

  register(): void {
    if (this.form.invalid) return;
    this.isLoading = true;

    const dto: RegisterIncomeDto = {
      sessionId:     this.sessionId,
      amount:        this.form.value.amount,
      concept:       this.form.value.concept === 'other'
                       ? this.form.value.customConcept
                       : this.concepts.find(c => c.value === this.form.value.concept)?.label ?? '',
      customConcept: this.form.value.customConcept || undefined,
      paymentMethod: this.form.value.paymentMethod,
      observations:  this.form.value.observations || undefined
    };

    this.cashService.registerIncome(dto).subscribe({
      next: res => {
        if ((res as any).success !== false) {
          this.alertService.success('Ingreso registrado exitosamente');
          this.closed.emit();
        } else {
          this.alertService.error('Error al registrar ingreso');
        }
        this.isLoading = false;
      },
      error: () => {
        this.alertService.error('Error de conexión');
        this.isLoading = false;
      }
    });
  }

  cancel(): void { this.closed.emit(); }
}
