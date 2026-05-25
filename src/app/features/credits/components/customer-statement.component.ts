import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
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
  private destroy$ = new Subject<void>();

  constructor(
    private creditsService: CreditsService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['id']) {
        this.loadStatement(params['id']);
      }
    });
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

  newCredit(): void {
    this.router.navigate(['/credits/nuevo-cliente']);
  }

  sendEmail(): void {
    if (confirm('¿Enviar estado de cuenta por email?')) {
      alert('Funcionalidad de envío de email en desarrollo');
    }
  }

  print(): void {
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
}
