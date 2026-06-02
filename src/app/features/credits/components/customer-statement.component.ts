import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { CreditsService } from '../services/credits.service';
import { CustomerStatement } from '../models/customer-statement.model';

@Component({
  selector: 'app-customer-statement',
  templateUrl: './customer-statement.component.html',
  styleUrls: ['./customer-statement.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class CustomerStatementComponent implements OnInit, OnDestroy {
  statement: CustomerStatement | null = null;
  loading = false;
  error: string | null = null;
  generatedBy: string = 'Sistema';
  now: Date = new Date();
  private destroy$ = new Subject<void>();

  constructor(
    private creditsService: CreditsService,
    private route: ActivatedRoute,
    private router: Router,
    private confirmation: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['id']) {
        this.loadStatement(params['id']);
      }
    });
    try {
      this.generatedBy = localStorage.getItem('currentUserName') || localStorage.getItem('userName') || 'Sistema';
    } catch (e) {
      this.generatedBy = 'Sistema';
    }
    this.now = new Date();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStatement(customerId: number): void {
    this.loading = true;
    this.error = null;
    this.creditsService.getCustomerStatement(customerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.statement = response?.data || response || null;
          this.loading = false;
        },
        error: (err) => {
          this.error = err.error?.message || 'Error al cargar estado de cuenta';
          this.loading = false;
        }
      });
  }

  getCreditUtilizationPercentage(): number {
    if (!this.statement) return 0;
    const limit = Number(this.statement.customer?.creditLimit || 0);
    if (!limit) return 0;
    return Math.min(100, Math.round((Number(this.statement.totalDebt || 0) / limit) * 100));
  }

  getDebtStatusClass(): string {
    const percentage = this.getCreditUtilizationPercentage();
    if (percentage >= 90) return 'danger';
    if (percentage >= 70) return 'warning';
    return 'success';
  }

  formatCreditStatus(status?: string): string {
    return this.translateStatus(status);
  }

  getCreditBadgeColor(status?: string): string {
    const normalized = status?.trim().toUpperCase();
    if (normalized === 'ACTIVE' || normalized === 'PAID') return 'success';
    if (normalized === 'OVERDUE') return 'danger';
    if (normalized === 'PENDING') return 'warning';
    return 'secondary';
  }

  newCredit(): void {
    this.router.navigate(['/credits/nuevo-cliente']);
  }

  sendEmail(): void {
    this.confirmation.confirm({
      title: 'Enviar estado de cuenta',
      message: '¿Enviar estado de cuenta por email?',
      confirmText: 'Enviar',
      cancelText: 'Cancelar',
      type: 'info'
    }).subscribe(ok => {
      if (ok) {
        this.confirmation.confirm({ title: 'En desarrollo', message: 'Funcionalidad de envío de email en desarrollo', confirmText: 'Aceptar', cancelText: '' , type: 'info'}).subscribe();
      }
    });
  }

  print(): void {
    // Use the native browser print dialog directly.
    window.print();
  }

  goBack(): void {
    this.router.navigate(['/credits']);
  }

  getActiveCredits(): any[] {
    return this.statement?.activeCredits || [];
  }

  getPayments(): any[] {
    return this.statement?.payments || [];
  }

  getPaidCreditsCount(): number {
    return this.getPayments().length;
  }

  private translateStatus(status?: string): string {
    if (!status) {
      return 'Activo';
    }

    const normalized = status.trim().toLowerCase();
    const map: Record<string, string> = {
      'active': 'Activo',
      'activo': 'Activo',
      'inactive': 'Inactivo',
      'inactivo': 'Inactivo',
      'paid': 'Pagado',
      'pagado': 'Pagado',
      'overdue': 'Vencido',
      'vencido': 'Vencido',
      'pending': 'Pendiente',
      'pendiente': 'Pendiente',
      'cancelled': 'Cancelado',
      'cancelado': 'Cancelado',
      'suspended': 'Suspendido',
      'suspendido': 'Suspendido',
      'open': 'Abierto',
      'abierto': 'Abierto',
      'closed': 'Cerrado',
      'cerrado': 'Cerrado'
    };

    return map[normalized] || status;
  }

  getCustomerStatus(): string {
    return this.translateStatus(this.statement?.customer?.status);
  }
}
