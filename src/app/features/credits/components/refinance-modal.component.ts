import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CreditsService } from '../services/credits.service';

@Component({
  selector: 'app-refinance-modal',
  templateUrl: './refinance-modal.component.html',
  styleUrls: ['./refinance-modal.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class RefinanceModalComponent implements OnInit, OnChanges {
  @Input() credit: any = null;
  @Output() closed = new EventEmitter<void>();
  @Output() refinanceCompleted = new EventEmitter<void>();

  refinanceForm!: FormGroup;
  loading = false;
  error: string | null = null;
  success: string | null = null;

  constructor(private fb: FormBuilder, private creditsService: CreditsService) {}

  ngOnInit(): void {
    this.buildForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['credit'] && !changes['credit'].firstChange) {
      this.updateForm();
    }
  }

  buildForm(): void {
    this.refinanceForm = this.fb.group({
      termDays: [15, [Validators.required, Validators.min(1), Validators.max(365)]],
      interestRate: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      moraRateDaily: [0, [Validators.min(0), Validators.max(10)]],
      reason: ['', Validators.required],
      observations: ['']
    });
  }

  updateForm(): void {
    if (this.credit) {
      this.refinanceForm.patchValue({
        termDays: this.credit.termDays || 15,
        interestRate: this.credit.interestRate || 0,
        moraRateDaily: this.credit.moraRateDaily || 0
      });
    }
  }

  submit(): void {
    this.error = null;
    this.success = null;

    if (this.refinanceForm.invalid || !this.credit) return;

    this.loading = true;
    const payload = this.refinanceForm.value;

    this.creditsService.refinanceCredit(this.credit.id, payload)
      .subscribe({
        next: () => {
          this.loading = false;
          this.success = 'Crédito refinanciado exitosamente';
          setTimeout(() => {
            this.refinanceCompleted.emit();
            this.close();
          }, 1500);
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error?.message || 'Error al refinanciar crédito';
        }
      });
  }

  close(): void {
    this.closed.emit();
  }

  getErrorMessage(field: string): string {
    const control = this.refinanceForm.get(field);
    if (!control || !control.errors) return '';
    if (control.errors['required']) return 'Este campo es obligatorio';
    if (control.errors['min']) return `Valor mínimo es ${control.errors['min'].min}`;
    if (control.errors['max']) return `Valor máximo es ${control.errors['max'].max}`;
    return 'Campo inválido';
  }

  isFieldInvalid(field: string): boolean {
    const control = this.refinanceForm.get(field);
    return !!control && control.invalid && control.touched;
  }
}
