import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { CashRegisterService } from '../../services/cash-register.service';
import { AlertService } from '../../../../core/services/alert.service';
import { RegisterExpenseDto, EXPENSE_CONCEPTS, EXPENSE_AUTH_LIMIT } from '../../models/cash-register.model';

/**
 * Modal 4: Registrar Egreso
 */
@Component({
  selector: 'app-expense-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './expense-modal.component.html',
  styleUrl: './expense-modal.component.css'
})
export class ExpenseModalComponent {

  @Input() sessionId = 0;
  @Input() currentExpectedCash = 0;
  @Output() closed = new EventEmitter<void>();

  form: FormGroup;
  isLoading = false;

  readonly concepts      = EXPENSE_CONCEPTS;
  readonly authLimit     = EXPENSE_AUTH_LIMIT;

  get newTotal(): number {
    return this.currentExpectedCash - (this.form.value.amount || 0);
  }

  get showCustomConcept(): boolean {
    return this.form.value.concept === 'other';
  }

  get requiresAuth(): boolean {
    return (this.form.value.amount || 0) > this.authLimit;
  }

  constructor(
    private fb: FormBuilder,
    private cashService: CashRegisterService,
    private alertService: AlertService
  ) {
    this.form = this.fb.group({
      amount:           [null, [Validators.required, Validators.min(0.01)]],
      concept:          ['bags', Validators.required],
      customConcept:    [''],
      voucherNumber:    [''],
      authorizedBy:     [null],
      supervisorPassword: [''],
      observations:     ['']
    });
  }

  register(): void {
    if (this.form.invalid) return;
    if (this.requiresAuth && !this.form.value.supervisorPassword) {
      this.alertService.warning('Se requiere contraseña del supervisor para montos mayores a $' + this.authLimit);
      return;
    }
    this.isLoading = true;

    const dto: RegisterExpenseDto = {
      sessionId:    this.sessionId,
      amount:       this.form.value.amount,
      concept:      this.form.value.concept === 'other'
                      ? this.form.value.customConcept
                      : this.concepts.find(c => c.value === this.form.value.concept)?.label ?? '',
      customConcept: this.form.value.customConcept || undefined,
      voucherNumber: this.form.value.voucherNumber || undefined,
      authorizedBy:  this.form.value.authorizedBy || undefined,
      supervisorPassword: this.form.value.supervisorPassword || undefined,
      observations:  this.form.value.observations || undefined
    };

    this.cashService.registerExpense(dto).subscribe({
      next: res => {
        if ((res as any).success !== false) {
          this.alertService.success('Egreso registrado exitosamente');
          this.closed.emit();
        } else {
          this.alertService.error('Error al registrar egreso');
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
