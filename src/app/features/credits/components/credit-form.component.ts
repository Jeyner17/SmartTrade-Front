import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CreditsService } from '../services/credits.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-credit-form',
  templateUrl: './credit-form.component.html',
  styleUrls: ['./credit-form.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class CreditFormComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  isLoading = false;
  isSaving = false;
  error: string | null = null;
  submitted = false;
  successMessage: string | null = null;
  customers: any[] = [];
  sales: any[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private creditsService: CreditsService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadCustomersAndSales();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  buildForm(): void {
    this.form = this.fb.group({
      customerId: ['', Validators.required],
      saleId: ['', Validators.required],
      termDays: [15, [Validators.required, Validators.min(1), Validators.max(365)]],
      interestRate: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      observations: ['']
    });
  }

  loadCustomersAndSales(): void {
    this.isLoading = true;

    // Cargar clientes de crédito
    this.creditsService.getCustomers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          const customerData = response.data;
          this.customers = Array.isArray(customerData) ? customerData : (customerData?.data || []);

          // Cargar ventas
          this.http.get<any>('/api/v1/credits/sales')
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (saleResponse: any) => {
                const saleData = saleResponse.data;
                this.sales = Array.isArray(saleData) ? saleData : (saleData?.data || []);
                this.isLoading = false;
              },
              error: () => {
                console.warn('No se pudieron cargar las ventas');
                this.isLoading = false;
              }
            });
        },
        error: () => {
          console.warn('No se pudieron cargar los clientes');
          this.isLoading = false;
        }
      });
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
    if (control.errors['min']) return `Valor mínimo es ${control.errors['min'].min}`;
    if (control.errors['max']) return `Valor máximo es ${control.errors['max'].max}`;
    return 'Campo inválido';
  }

  submit(): void {
    this.submitted = true;
    this.error = null;
    this.successMessage = null;

    if (this.form.invalid) return;

    this.isSaving = true;
    const payload = this.form.value;

    this.creditsService.createCredit(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.successMessage = 'Crédito creado exitosamente';
          setTimeout(() => {
            this.router.navigate(['/credits']);
          }, 1500);
        },
        error: (err) => {
          this.isSaving = false;
          this.error = err.error?.message || 'Error al guardar crédito';
        }
      });
  }

  cancel(): void {
    this.router.navigate(['/credits']);
  }
}
