import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { CashRegisterService } from '../../services/cash-register.service';
import { AuthService } from '../../../../core/services/auth.service';
import { AlertService } from '../../../../core/services/alert.service';
import {
  DENOMINATION_ALL,
  DenominationCount,
  OpenCashDto
} from '../../models/cash-register.model';
import { DenominationCalculatorComponent } from '../denomination-calculator/denomination-calculator.component';

/**
 * Pantalla 1: Apertura de Caja
 * Sprint 14 - Gestión de Caja
 */
@Component({
  selector: 'app-cash-open',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DenominationCalculatorComponent],
  templateUrl: './cash-open.component.html',
  styleUrl: './cash-open.component.css'
})
export class CashOpenComponent implements OnInit {

  readonly denominations = DENOMINATION_ALL;
  form!: FormGroup;
  isLoading = false;
  currentDate = new Date();
  cashierName = '';
  cashierId = 0;

  denominationCount: DenominationCount[] = [];
  denominationTotal = 0;

  readonly cashNumbers = [1, 2, 3, 4, 5];

  constructor(
    private fb: FormBuilder,
    private cashService: CashRegisterService,
    private authService: AuthService,
    private alertService: AlertService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadCashierData();
    this.checkExistingSession();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      cashNumber:    [1, [Validators.required, Validators.min(1)]],
      initialAmount: [0, [Validators.required, Validators.min(0)]],
      observations:  ['']
    });
  }

  private loadCashierData(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.cashierName = user.fullName;
      this.cashierId = user.id;
    }
  }

  private checkExistingSession(): void {
    const active = this.cashService.getActiveSession();
    if (active) {
      this.alertService.info('Ya tiene una caja abierta. Redirigiendo...');
      this.router.navigate(['/cash-register/status']);
    }
  }

  onDenominationsChange(denominations: DenominationCount[]): void {
    this.denominationCount = denominations;
  }

  onTotalChange(total: number): void {
    this.denominationTotal = total;
    this.form.patchValue({ initialAmount: total });
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }

  openCash(): void {
    if (this.form.invalid) return;
    this.isLoading = true;

    const dto: OpenCashDto = {
      cashierId:        this.cashierId,
      cashNumber:       this.form.value.cashNumber,
      initialAmount:    this.form.value.initialAmount,
      denominationCount: this.denominationCount,
      observations:     this.form.value.observations || undefined
    };

    this.cashService.openCash(dto).subscribe({
      next: res => {
        if (res.success) {
          this.alertService.success('Caja abierta exitosamente');
          this.router.navigate(['/cash-register/status']);
        } else {
          this.alertService.error(res.message || 'Error al abrir caja');
        }
        this.isLoading = false;
      },
      error: () => {
        this.alertService.error('Error de conexión al abrir caja');
        this.isLoading = false;
      }
    });
  }
}
