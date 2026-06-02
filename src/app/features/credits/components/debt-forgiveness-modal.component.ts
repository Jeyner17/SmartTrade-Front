import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CreditsService } from '../services/credits.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';

@Component({
  selector: 'app-debt-forgiveness-modal',
  templateUrl: './debt-forgiveness-modal.component.html',
  styleUrls: ['./debt-forgiveness-modal.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class DebtForgivenessModalComponent implements OnInit, OnChanges {
  @Input() credit: any = null;
  @Output() closed = new EventEmitter<void>();
  @Output() debtForgiven = new EventEmitter<void>();

  forgivenessForm!: FormGroup;
  loading = false;
  error: string | null = null;
  success: string | null = null;

  reasons = [
    'Cliente fallecido',
    'Incobrable',
    'Acuerdo comercial',
    'Otro'
  ];

  constructor(private fb: FormBuilder, private creditsService: CreditsService, private confirmation: ConfirmationService) {}

  ngOnInit(): void {
    this.buildForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['credit'] && !changes['credit'].firstChange) {
      this.updateForm();
    }
  }

  buildForm(): void {
    this.forgivenessForm = this.fb.group({
      type: ['total', Validators.required],
      amountForgiven: [0, [Validators.required, Validators.min(0.01)]],
      reason: ['', Validators.required],
      justification: ['', [Validators.required, Validators.minLength(10)]],
      supervisorPassword: ['', [Validators.required, Validators.minLength(4)]],
      observations: ['']
    });

    this.forgivenessForm.get('type')?.valueChanges.subscribe(() => this.updateAmount());
  }

  updateForm(): void {
    if (this.credit) {
      const totalAmount = this.credit.outstandingBalance + (this.credit.lateInterest || 0);
      this.forgivenessForm.patchValue({
        amountForgiven: totalAmount
      });
    }
  }

  updateAmount(): void {
    if (this.forgivenessForm.value.type === 'total') {
      const totalAmount = this.credit.outstandingBalance + (this.credit.lateInterest || 0);
      this.forgivenessForm.patchValue({
        amountForgiven: totalAmount
      });
    }
  }

  calculateNewBalance(): number {
    const forgivenAmount = this.forgivenessForm.value.amountForgiven || 0;
    const totalAmount = this.credit.outstandingBalance + (this.credit.lateInterest || 0);
    return Math.max(0, totalAmount - forgivenAmount);
  }

  validateAmount(): string | null {
    const amount = this.forgivenessForm.value.amountForgiven;
    const maxAmount = this.credit.outstandingBalance + (this.credit.lateInterest || 0);
    
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

    if (this.forgivenessForm.invalid) {
      this.error = 'Por favor complete todos los campos requeridos';
      return;
    }

    this.confirmation.confirm({
      title: 'Confirmar condonación',
      message: '¿Confirma la condonación de deuda? Esta acción es irreversible.',
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      type: 'danger'
    }).subscribe(confirmed => {
      if (!confirmed) return;

      this.executeForgive();
    });
    return;

  }

  private executeForgive(): void {
    this.loading = true;
    const formValue = this.forgivenessForm.value;
    const forgivenessData: any = {
      creditId: this.credit.id,
      amountForgiven: formValue.amountForgiven,
      reason: formValue.reason,
      metadata: {
        justification: formValue.justification,
        supervisorPassword: formValue.supervisorPassword,
        observations: formValue.observations
      }
    };

    this.creditsService.forgiveDebt(this.credit.id, forgivenessData).subscribe({
      next: () => {
        this.loading = false;
        this.success = 'Deuda condonada exitosamente';
        setTimeout(() => {
          this.debtForgiven.emit();
          this.onCancel();
        }, 1500);
      },
      error: err => {
        this.loading = false;
        this.error = err.error?.message || 'Error al condonar deuda';
      }
    });
  }

  onCancel(): void {
    this.forgivenessForm.reset();
    this.error = null;
    this.success = null;
    this.closed.emit();
  }
}
