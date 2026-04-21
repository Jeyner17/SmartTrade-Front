import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { CashRegisterService } from '../../services/cash-register.service';
import { AlertService } from '../../../../core/services/alert.service';
import { WithdrawalDto, DENOMINATION_ALL, DenominationCount, MAX_CASH_IN_DRAWER } from '../../models/cash-register.model';
import { DenominationCalculatorComponent } from '../denomination-calculator/denomination-calculator.component';

/**
 * Modal 5: Retiro a Caja Fuerte
 */
@Component({
  selector: 'app-withdrawal-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DenominationCalculatorComponent],
  templateUrl: './withdrawal-modal.component.html',
  styleUrl: './withdrawal-modal.component.css'
})
export class WithdrawalModalComponent {

  @Input() sessionId = 0;
  @Input() currentCash = 0;
  @Output() closed = new EventEmitter<void>();

  form: FormGroup;
  isLoading = false;

  readonly denominations    = DENOMINATION_ALL;
  readonly maxRecommended   = MAX_CASH_IN_DRAWER;
  denominationCount: DenominationCount[] = [];
  denominationTotal = 0;

  get remainingCash(): number {
    return this.currentCash - (this.form.value.amount || 0);
  }

  get suggestedWithdrawal(): number {
    return Math.max(0, this.currentCash - this.maxRecommended);
  }

  constructor(
    private fb: FormBuilder,
    private cashService: CashRegisterService,
    private alertService: AlertService
  ) {
    this.form = this.fb.group({
      amount:       [null, [Validators.required, Validators.min(0.01)]],
      receivedBy:   ['', Validators.required],
      authCode:     [''],
      observations: ['']
    });
  }

  onTotalChange(total: number): void {
    this.denominationTotal = total;
    this.form.patchValue({ amount: total });
  }

  onDenominationsChange(denominations: DenominationCount[]): void {
    this.denominationCount = denominations;
  }

  useSuggested(): void {
    this.form.patchValue({ amount: this.suggestedWithdrawal });
  }

  register(): void {
    if (this.form.invalid) return;
    if ((this.form.value.amount || 0) > this.currentCash) {
      this.alertService.error('El monto a retirar supera el efectivo disponible en caja');
      return;
    }
    this.isLoading = true;

    const dto: WithdrawalDto = {
      sessionId:        this.sessionId,
      amount:           this.form.value.amount,
      receivedBy:       this.form.value.receivedBy,
      authCode:         this.form.value.authCode || undefined,
      denominationCount: this.denominationCount,
      observations:     this.form.value.observations || undefined
    };

    this.cashService.registerWithdrawal(dto).subscribe({
      next: res => {
        if ((res as any).success !== false) {
          this.alertService.success('Retiro registrado exitosamente');
          this.closed.emit();
        } else {
          this.alertService.error('Error al registrar retiro');
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
