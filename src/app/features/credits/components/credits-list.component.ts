import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CreditsService } from '../services/credits.service';
import { Credit } from '../models/credit.model';
import { PaymentModalComponent } from './payment-modal.component';

@Component({
  selector: 'app-credits-list',
  templateUrl: './credits-list.component.html',
  styleUrls: ['./credits-list.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, PaymentModalComponent]
})
export class CreditsListComponent implements OnInit, OnDestroy {
  credits: any[] = [];
  loading = false;
  showPaymentModal = false;
  selectedCredit: any = null;
  totalStats = {
    totalDue: 0,
    activeCredits: 0,
    overdueCredits: 0,
    overdueAmount: 0,
    dueThisWeek: 0
  };
  
  filters = {
    customerName: '',
    status: 'todos',
    orderBy: 'fecha'
  };

  statuses = [
    { value: 'todos', label: 'Todos' },
    { value: 'ACTIVE', label: 'Al día' },
    { value: 'por-vencer', label: 'Por vencer' },
    { value: 'OVERDUE', label: 'Vencidos' },
    { value: 'mora-grave', label: 'Mora grave' }
  ];

  orderOptions = [
    { value: 'fecha', label: 'Fecha' },
    { value: 'monto', label: 'Monto' },
    { value: 'cliente', label: 'Cliente' }
  ];

  private destroy$ = new Subject<void>();

  constructor(private creditsService: CreditsService, private router: Router) {}

  ngOnInit(): void {
    this.loadCredits();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCredits(): void {
    this.loading = true;
    const params: any = {};
    if (this.filters.customerName) params.customerName = this.filters.customerName;
    if (this.filters.status !== 'todos') params.status = this.filters.status;
    params.orderBy = this.filters.orderBy;

    this.creditsService.getCredits(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          // El backend retorna: { success: true, data: { data: [...], pagination: {...} } }
          const creditData = response.data;
          this.credits = Array.isArray(creditData) ? creditData : (creditData?.data || []);
          this.calculateStats();
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  calculateStats(): void {
    const today = new Date();
    const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    this.totalStats.activeCredits = this.credits.filter(c => c.status === 'ACTIVE').length;
    this.totalStats.overdueCredits = this.credits.filter(c => c.status === 'OVERDUE').length;
    this.totalStats.overdueAmount = this.credits
      .filter(c => c.status === 'OVERDUE')
      .reduce((sum, c) => sum + (c.outstandingBalance || 0), 0);
    
    this.totalStats.dueThisWeek = this.credits.filter(c => {
      const dueDate = new Date(c.dueDate);
      return c.status === 'ACTIVE' && dueDate > today && dueDate <= sevenDaysLater;
    }).length;

    this.totalStats.totalDue = this.credits.reduce((sum, c) => sum + (c.outstandingBalance || 0), 0);
  }

  getStatusColor(credit: any): string {
    const today = new Date();
    const dueDate = new Date(credit.dueDate);
    const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (credit.status === 'OVERDUE') {
      return daysRemaining <= -7 ? 'rojo' : daysRemaining <= -1 ? 'naranja' : 'amarillo';
    }
    if (daysRemaining < 3 && daysRemaining >= 0) return 'amarillo';
    return 'verde';
  }

  getDaysLateness(credit: any): string {
    if (credit.status !== 'OVERDUE') return '';
    const today = new Date();
    const dueDate = new Date(credit.dueDate);
    const daysLate = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysLate > 0 ? `+${daysLate} días` : '';
  }

  onFilterChange(): void {
    this.loadCredits();
  }

  viewDetail(creditId: number): void {
    this.router.navigate(['/credits/detalle', creditId]);
  }

  openPaymentModal(credit: any): void {
    this.selectedCredit = credit;
    this.showPaymentModal = true;
  }

  closePaymentModal(): void {
    this.showPaymentModal = false;
    this.selectedCredit = null;
  }

  onPaymentRegistered(): void {
    this.closePaymentModal();
    this.loadCredits();
  }

  sendReminder(creditId: number): void {
    if (confirm('¿Enviar recordatorio de pago a este cliente?')) {
      this.creditsService.createReminder(creditId, { channel: 'EMAIL' })
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

  viewCustomerStatement(customerId: number): void {
    this.router.navigate(['/credits/estado-cuenta', customerId]);
  }

  newCredit(): void {
    this.router.navigate(['/credits/nuevo-cliente']);
  }

  createCredit(): void {
    this.router.navigate(['/credits/nuevo-credito']);
  }

  viewDelinquent(): void {
    this.router.navigate(['/credits/morosos']);
  }

  export(): void {
    alert('Funcionalidad de exportación en desarrollo');
  }
}
