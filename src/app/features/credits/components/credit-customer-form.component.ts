import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CreditsService } from '../services/credits.service';

@Component({
  selector: 'app-credit-customer-form',
  templateUrl: './credit-customer-form.component.html',
  styleUrls: ['./credit-customer-form.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class CreditCustomerFormComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  isLoading = false;
  isSaving = false;
  error: string | null = null;
  submitted = false;
  successMessage: string | null = null;
  private destroy$ = new Subject<void>();

  creditRatings = ['A', 'B', 'C'];
  relationshipTypes = ['familiar', 'laboral', 'personal'];

  constructor(
    private fb: FormBuilder,
    private creditsService: CreditsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.buildForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  buildForm() {
    this.form = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      documentNumber: ['', [Validators.required, Validators.minLength(5)]],
      birthDate: ['', Validators.required],
      address: ['', [Validators.required, Validators.minLength(5)]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{7,}$/)]],
      secondaryPhone: ['', [Validators.pattern(/^\d{7,}$/)]],
      email: ['', [Validators.required, Validators.email]],
      creditLimit: [0, [Validators.required, Validators.min(100)]],
      defaultTerm: [0, [Validators.required, Validators.min(1), Validators.max(365)]],
      creditRating: ['A', Validators.required],
      applyLateInterest: [false],
      references: this.fb.array([]),
      documents: this.fb.group({
        idCopy: [null],
        addressProof: [null],
        others: [[]]
      })
    });

    // Agregar una referencia por defecto
    this.addReference();
  }

  get references() {
    return this.form.get('references') as FormArray;
  }

  addReference() {
    const refForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      relationship: ['familiar', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^\d{7,}$/)]]
    });
    this.references.push(refForm);
  }

  removeReference(index: number) {
    if (this.references.length > 1) {
      this.references.removeAt(index);
    }
  }

  onFileChange(event: any, docType: string) {
    const file = event.target.files[0];
    if (file) {
      this.form.get('documents.' + docType)?.setValue(file);
    }
  }

  isFieldInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!control && control.invalid && (control.dirty || control.touched || this.submitted);
  }

  isFieldValid(field: string): boolean {
    const control = this.form.get(field);
    return !!control && control.valid && (control.dirty || control.touched || this.submitted);
  }

  getErrorMessage(field: string): string {
    const control = this.form.get(field);
    if (!control || !control.errors) return '';
    if (control.errors['required']) return 'Este campo es obligatorio';
    if (control.errors['email']) return 'Formato de email inválido';
    if (control.errors['pattern']) return 'Formato inválido';
    if (control.errors['min']) return 'Valor muy bajo';
    if (control.errors['max']) return 'Valor muy alto';
    if (control.errors['minLength']) return `Mínimo ${control.errors['minLength'].requiredLength} caracteres`;
    return 'Campo inválido';
  }

  submit() {
    this.submitted = true;
    this.error = null;
    this.successMessage = null;

    if (this.form.invalid) return;

    this.isSaving = true;
    const formValue = this.form.value;
    
    // Preparar datos según lo que espera el backend
    const payload = {
      fullName: formValue.fullName,
      documentNumber: formValue.documentNumber,
      address: formValue.address,
      phone: formValue.phone,
      email: formValue.email,
      creditLimit: Number(formValue.creditLimit) || 0,
      references: formValue.references && formValue.references.length > 0 
        ? JSON.stringify(formValue.references) 
        : null
    };

    this.creditsService.createCustomer(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.successMessage = 'Cliente creado exitosamente';
          setTimeout(() => {
            this.router.navigate(['/credits']);
          }, 1500);
        },
        error: err => {
          this.isSaving = false;
          this.error = err.error?.message || 'Error al guardar cliente';
          console.error('Error:', err);
        }
      });
  }

  cancel() {
    this.router.navigate(['/credits']);
  }
}
