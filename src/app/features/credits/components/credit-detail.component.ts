import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CreditsService } from '../services/credits.service';
import { PaymentModalComponent } from './payment-modal.component';
import { DebtForgivenessModalComponent } from './debt-forgiveness-modal.component';
import { RefinanceModalComponent } from './refinance-modal.component';

@Component({
  selector: 'app-credit-detail',
  templateUrl: './credit-detail.component.html',
  styleUrls: ['./credit-detail.component.css'],
  standalone: true,
  imports: [CommonModule, PaymentModalComponent, DebtForgivenessModalComponent, RefinanceModalComponent]
})
export class CreditDetailComponent implements OnInit, OnDestroy {
  credit: any = null;
  loading = false;
  error: string | null = null;
  showPaymentModal = false;
  showRefinanceModal = false;
  showForgiveModal = false;
  private destroy$ = new Subject<void>();

  constructor(
    private creditsService: CreditsService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['id']) {
        this.loadDetail(params['id']);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDetail(creditId: number): void {
    this.loading = true;
    this.error = null;
    this.creditsService.getCreditById(creditId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          // El backend retorna: { success: true, data: { id, customerId, ... } }
          this.credit = response.data || response;
          this.calculateStats();
          this.loading = false;
        },
        error: (err) => {
          this.error = err.error?.message || 'Error al cargar detalle de crédito';
          this.loading = false;
        }
      });
  }

  calculateStats(): void {
    if (!this.credit) return;

    const today = new Date();
    const dueDate = new Date(this.credit.dueDate);
    const daysLate = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    this.credit.daysLate = Math.max(0, daysLate);
    
    // Calcular intereses por mora
    if (this.credit.status === 'OVERDUE' && daysLate > 0) {
      this.credit.lateInterest = Number((
        this.credit.outstandingBalance * this.credit.moraRateDaily * daysLate
      ).toFixed(2));
      this.credit.totalAmount = Number((
        this.credit.outstandingBalance + this.credit.lateInterest
      ).toFixed(2));
    } else {
      this.credit.lateInterest = 0;
      this.credit.totalAmount = this.credit.outstandingBalance;
    }
  }

  getStatusDisplay(): string {
    const statusMap: any = {
      'ACTIVE': 'Activo',
      'PAID': 'Pagado',
      'OVERDUE': 'Vencido',
      'FORGIVEN': 'Condonado',
      'REFINANCED': 'Refinanciado'
    };
    return statusMap[this.credit?.status] || this.credit?.status;
  }

  getStatusColor(): string {
    if (this.credit.status === 'PAID') return 'verde';
    if (this.credit.status === 'OVERDUE' && this.credit.daysLate > 7) return 'rojo';
    if (this.credit.status === 'OVERDUE') return 'naranja';
    if (this.credit.status === 'ACTIVE') return 'verde';
    return 'gris';
  }

  openPaymentModal(): void {
    this.showPaymentModal = true;
  }

  closePaymentModal(): void {
    this.showPaymentModal = false;
  }

  openRefinanceModal(): void {
    this.showRefinanceModal = true;
  }

  closeRefinanceModal(): void {
    this.showRefinanceModal = false;
  }

  onRefinanceCompleted(): void {
    this.closeRefinanceModal();
    this.loadDetail(this.credit.id);
  }

  openForgiveModal(): void {
    this.showForgiveModal = true;
  }

  closeForgiveModal(): void {
    this.showForgiveModal = false;
  }

  onPaymentRegistered(): void {
    this.closePaymentModal();
    this.loadDetail(this.credit.id);
  }

  sendReminder(): void {
    if (confirm('¿Enviar recordatorio de pago a este cliente?')) {
      this.creditsService.createReminder(this.credit.id, { channel: 'EMAIL' })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            alert('Recordatorio enviado exitosamente');
          },
          error: () => {
            alert('Error al enviar recordatorio');
          }
        });
    }
  }

  print(): void {
    window.print();
  }

  goBack(): void {
    this.router.navigate(['/credits']);
  }
}
