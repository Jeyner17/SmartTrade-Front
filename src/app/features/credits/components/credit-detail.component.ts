import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CreditsService } from '../services/credits.service';
import { NotificationsService } from '../services/notifications.service';
import { PaymentModalComponent } from './payment-modal.component';
import { DebtForgivenessModalComponent } from './debt-forgiveness-modal.component';
import { RefinanceModalComponent } from './refinance-modal.component';

@Component({
  selector: 'app-credit-detail',
  templateUrl: './credit-detail.component.html',
  styleUrls: ['./credit-detail.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, PaymentModalComponent, DebtForgivenessModalComponent, RefinanceModalComponent]
})
export class CreditDetailComponent implements OnInit, OnDestroy {
  credit: any = null;
  loading = false;
  error: string | null = null;
  showPaymentModal = false;
  showRefinanceModal = false;
  showForgiveModal = false;
  showReminderModal = false;
  reminderChannel: 'EMAIL' | 'SMS' = 'EMAIL';
  sendingReminder = false;
  private destroy$ = new Subject<void>();

  constructor(
    private creditsService: CreditsService,
    private notificationsService: NotificationsService,
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

    // Calcular intereses por mora — asegurarse que los valores sean numéricos
    const outstanding = Number(this.credit.outstandingBalance || 0);
    const rate = Number(this.credit.moraRateDaily || 0);

    if (this.credit.status === 'OVERDUE' && daysLate > 0) {
      const late = outstanding * rate * daysLate;
      this.credit.lateInterest = Number(late.toFixed(2));
      this.credit.totalAmount = Number((outstanding + this.credit.lateInterest).toFixed(2));
    } else {
      this.credit.lateInterest = 0;
      this.credit.totalAmount = Number(outstanding.toFixed(2));
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

  openReminderModal(): void {
    if (!this.credit?.customer?.email && !this.credit?.customer?.phone) {
      alert('Este cliente no tiene email ni teléfono registrado para enviar el recordatorio');
      return;
    }

    this.reminderChannel = this.credit?.customer?.email ? 'EMAIL' : 'SMS';
    this.showReminderModal = true;
  }

  closeReminderModal(): void {
    this.showReminderModal = false;
    this.sendingReminder = false;
  }

  sendReminder(): void {
    if (!this.credit) return;

    this.sendingReminder = true;
    this.notificationsService.sendReminder(this.credit, this.reminderChannel)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.sendingReminder = false;
          this.closeReminderModal();
          alert('Recordatorio enviado exitosamente');
        },
        error: (error) => {
          this.sendingReminder = false;
          alert(error.error?.message || error.message || 'Error al enviar recordatorio');
        }
      });
  }

  print(): void {
    window.print();
  }

  goBack(): void {
    this.router.navigate(['/credits']);
  }
}
