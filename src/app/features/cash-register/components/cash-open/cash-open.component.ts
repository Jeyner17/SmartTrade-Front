import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { CashRegisterService } from '../../services/cash-register.service';
import { AuthService } from '../../../../core/services/auth.service';
import { AlertService } from '../../../../core/services/alert.service';
import {
  DENOMINATION_ALL,
  DenominationCount,
  OpenCashDto,
  CashSession
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

  openSessions: CashSession[] = [];
  isLoadingOpenSessions = false;

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
      this.cashierId = Number(user.id);
    }
  }

  private checkExistingSession(): void {
    if (!this.cashierId) {
      return;
    }

    this.isLoadingOpenSessions = true;
    this.cashService.getOpenSessionsForCashier(this.cashierId).subscribe({
      next: res => {
        const serverOpenSessions = res.data ?? [];
        this.openSessions = serverOpenSessions;

        const localActive = this.cashService.getActiveSession();
        if (localActive) {
          const localStillOpen = serverOpenSessions.some(s => s.id === localActive.id);
          if (!localStillOpen) {
            // Evita redirecciones por una sesión cacheada que ya fue cerrada.
            this.cashService.clearSession();
          }
        }

        if (serverOpenSessions.length > 0) {
          this.alertService.info('Tiene cajas abiertas. Use "Continuar" para retomarlas.');
        }

        this.isLoadingOpenSessions = false;
      },
      error: () => {
        this.isLoadingOpenSessions = false;
      }
    });
  }

  loadOpenSessions(): void {
    if (!this.cashierId) {
      this.alertService.warning('No se pudo obtener el ID del cajero. Inicie sesion de nuevo.');
      return;
    }

    this.isLoadingOpenSessions = true;
    this.cashService.getOpenSessionsForCashier(this.cashierId).subscribe({
      next: res => {
        this.openSessions = res.data ?? [];
        if (!this.openSessions.length) {
          this.alertService.info('No hay cajas abiertas para este cajero.');
        }
        this.isLoadingOpenSessions = false;
      },
      error: () => {
        this.alertService.error('Error al cargar cajas abiertas');
        this.isLoadingOpenSessions = false;
      }
    });
  }

  resumeSession(session: CashSession): void {
    this.cashService.setActiveSession(session);
    this.alertService.success(`Caja ${session.cashNumber} activada`);
    this.router.navigate(['/cash-register/status']);
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
    if (!this.cashierId || this.cashierId < 1) {
      this.alertService.error('No se pudo obtener el ID del cajero. Inicie sesion de nuevo.');
      return;
    }
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
          if (res.data) {
            this.cashService.setActiveSession({
              ...res.data,
              cashierName: this.cashierName,
              cashierId: this.cashierId,
              cashNumber: this.form.value.cashNumber,
              initialAmount: this.form.value.initialAmount
            });
          }
          this.alertService.success('Caja abierta exitosamente');
          this.router.navigate(['/cash-register/status']);
        } else {
          this.alertService.error(res.message || 'Error al abrir caja');
        }
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        const apiMessage = err?.error?.message;
        const validationErrors = Array.isArray(err?.error?.errors)
          ? err.error.errors.map((e: any) => e.message).filter(Boolean).join(' | ')
          : null;
        this.alertService.error(validationErrors || apiMessage || 'Error al abrir caja');
        this.isLoading = false;
      }
    });
  }
}
