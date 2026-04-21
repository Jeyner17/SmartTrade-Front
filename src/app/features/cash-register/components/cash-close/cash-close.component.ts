import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { CashRegisterService } from '../../services/cash-register.service';
import { AlertService } from '../../../../core/services/alert.service';
import { AuthService } from '../../../../core/services/auth.service';
import {
  DENOMINATION_ALL,
  DenominationCount,
  CloseCashDto,
  CashArqueo
} from '../../models/cash-register.model';
import { DenominationCalculatorComponent } from '../denomination-calculator/denomination-calculator.component';

/**
 * Pantalla 6: Proceso de Cierre de Caja (Wizard 3 pasos)
 * Sprint 14 - Gestión de Caja
 */
@Component({
  selector: 'app-cash-close',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DenominationCalculatorComponent],
  templateUrl: './cash-close.component.html',
  styleUrl: './cash-close.component.css'
})
export class CashCloseComponent implements OnInit {

  step = 1;
  readonly denominations = DENOMINATION_ALL;

  arqueo: CashArqueo | null = null;
  isLoadingArqueo = true;

  physicalCount: DenominationCount[] = [];
  physicalTotal = 0;

  form: FormGroup;
  isClosing = false;

  constructor(
    private fb: FormBuilder,
    private cashService: CashRegisterService,
    private alertService: AlertService,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      confirmed:             [false, Validators.requiredTrue],
      observations:          [''],
      differenceExplanation: ['']
    });
  }

  ngOnInit(): void {
    const session = this.cashService.getActiveSession();
    if (!session) {
      this.alertService.warning('No hay caja abierta.');
      this.router.navigate(['/cash-register']);
      return;
    }
    this.cashService.getArqueo(session.id).subscribe({
      next: res => {
        if (res.success && res.data) this.arqueo = res.data;
        this.isLoadingArqueo = false;
      },
      error: () => { this.isLoadingArqueo = false; }
    });
  }

  get sessionId(): number {
    return this.cashService.getActiveSession()?.id ?? 0;
  }

  // ── Denominaciones ─────────────────────────────────────
  onTotalChange(total: number): void {
    this.physicalTotal = total;
  }

  onDenominationsChange(denominations: DenominationCount[]): void {
    this.physicalCount = denominations;
  }

  // ── Diferencia ─────────────────────────────────────────
  get expectedCash(): number {
    return this.arqueo?.expectedCash ?? 0;
  }

  get difference(): number {
    return this.physicalTotal - this.expectedCash;
  }

  get differenceLabel(): string {
    if (this.difference === 0)  return 'Exacto';
    if (this.difference > 0)   return `+${this.formatCurrency(this.difference)} (Sobrante)`;
    return `${this.formatCurrency(this.difference)} (Faltante)`;
  }

  get differenceClass(): string {
    if (this.difference === 0) return 'exact';
    return this.difference > 0 ? 'surplus' : 'shortage';
  }

  get hasMajorDifference(): boolean {
    return Math.abs(this.difference) > 5;
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  }

  // ── Navegación entre pasos ─────────────────────────────
  nextStep(): void {
    if (this.step < 3) this.step++;
  }

  prevStep(): void {
    if (this.step > 1) this.step--;
  }

  recount(): void {
    this.step = 2;
    this.physicalTotal = 0;
    this.physicalCount = [];
  }

  // ── Cerrar Caja ────────────────────────────────────────
  closeCash(): void {
    if (this.form.invalid) return;
    if (this.hasMajorDifference && !this.form.value.differenceExplanation) {
      this.alertService.warning('Debe explicar la diferencia mayor a $5.');
      return;
    }
    if (!this.sessionId || this.sessionId < 1) {
      this.alertService.error('No se detecto una caja abierta. Regrese a estado de caja.');
      return;
    }

    this.isClosing = true;
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.id) {
      this.alertService.error('No se pudo obtener el ID del usuario. Inicie sesion de nuevo.');
      this.isClosing = false;
      return;
    }
    const dto: CloseCashDto = {
      sessionId:             this.sessionId,
      physicalCount:         this.physicalCount,
      countedBy:             currentUser.id,
      verifiedBy:            undefined,
      observations:          this.form.value.observations || undefined,
      differenceExplanation: this.form.value.differenceExplanation || undefined
    };

    this.cashService.closeCash(dto).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.alertService.success('Caja cerrada exitosamente');
          this.router.navigate(['/cash-register/report', res.data.session.id]);
        } else {
          this.alertService.error(res.message || 'Error al cerrar la caja');
        }
        this.isClosing = false;
      },
      error: (err: HttpErrorResponse) => {
        const apiMessage = err?.error?.message;
        const validationErrors = Array.isArray(err?.error?.errors)
          ? err.error.errors.map((e: any) => e.message).filter(Boolean).join(' | ')
          : null;
        this.alertService.error(validationErrors || apiMessage || 'Error al cerrar la caja');
        this.isClosing = false;
      }
    });
  }
}
