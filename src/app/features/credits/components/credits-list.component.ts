import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CreditsService } from '../services/credits.service';
import { Credit } from '../models/credit.model';
import { NotificationsService } from '../services/notifications.service';
import { PaymentModalComponent } from './payment-modal.component';
import { ConfirmationService } from '../../../core/services/confirmation.service';

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

  constructor(
    private creditsService: CreditsService,
    private notificationsService: NotificationsService,
    private router: Router,
    private confirmation: ConfirmationService
  ) {}

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

    this.totalStats.totalDue = this.credits.reduce((sum, c) => sum + Number(c.outstandingBalance || 0), 0);
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

  sendReminder(credit: any): void {
    this.confirmation.confirm({ title: 'Enviar recordatorio', message: '¿Enviar recordatorio de pago a este cliente?', confirmText: 'Enviar', cancelText: 'Cancelar', type: 'info' })
      .subscribe(ok => {
        if (!ok) return;
        this.notificationsService.sendReminder(credit)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.showToast('Recordatorio enviado exitosamente');
            },
            error: (error) => {
              this.confirmation.confirm({ title: 'Error', message: error.error?.message || error.message || 'Error al enviar recordatorio', confirmText: 'Aceptar', cancelText: '', type: 'danger' }).subscribe();
            }
          });
      });
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
    this.loading = true;
    setTimeout(() => {
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const fecha = `${now.getFullYear()}_${pad(now.getMonth() + 1)}_${pad(now.getDate())}`;
      const hora = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
      const usuario = localStorage.getItem('userName') || 'Usuario';

      // Usar punto y coma como delimitador
      const sep = ';';
      let csv = '';

      // Encabezado superior con líneas y símbolos
      csv += `========================================${sep.repeat(5)}\r\n`;
      csv += `★ SMART TRADE${sep.repeat(7)}\r\n`;
      csv += `► REPORTE DE CRÉDITOS${sep.repeat(6)}\r\n`;
      csv += `========================================${sep.repeat(5)}\r\n`;
      csv += `FECHA DE EXPORTACIÓN:${sep}${fecha} ${hora}${sep.repeat(6)}\r\n`;
      csv += `USUARIO:${sep}${usuario}${sep.repeat(7)}\r\n`;
      csv += sep.repeat(9) + '\r\n';

      // Sección resumen con líneas
      csv += `---------- RESUMEN ----------${sep.repeat(5)}\r\n`;
      csv += `TOTAL POR COBRAR:${sep}${this.formatMoney(this.totalStats.totalDue)}${sep.repeat(6)}\r\n`;
      csv += `CRÉDITOS ACTIVOS:${sep}${this.totalStats.activeCredits}${sep.repeat(6)}\r\n`;
      csv += `CRÉDITOS VENCIDOS:${sep}${this.totalStats.overdueCredits}${sep.repeat(6)}\r\n`;
      csv += `POR VENCER ESTA SEMANA:${sep}${this.totalStats.dueThisWeek}${sep.repeat(5)}\r\n`;
      csv += sep.repeat(9) + '\r\n';
      csv += `========================================${sep.repeat(5)}\r\n`;

      // Encabezados tabla principal destacados
      csv += [
        'CLIENTE',
        'N° CRÉDITO',
        'FECHA',
        'MONTO ORIGINAL',
        'PAGADO',
        'SALDO PENDIENTE',
        'FECHA VENCIMIENTO',
        'DÍAS ATRASO',
        'ESTADO'
      ].map(h => `**${h}**`).join(sep) + '\r\n';

      // Filas de créditos visibles (con filtros)
      let totalOriginal = 0, totalPagado = 0, totalSaldo = 0;
      this.credits.forEach(c => {
        // Asegurar valores numéricos y no negativos
        const principal = Number(c.principalAmount) || 0;
        const saldoPendiente = Number(c.outstandingBalance) || 0;
        let pagado = principal - saldoPendiente;
        if (pagado < 0) pagado = 0;
        if (saldoPendiente < 0) pagado = principal;
        // Formatos
        const cliente = (c.customer?.fullName || 'N/A').replace(/\n|\r|;/g, ' ');
        const fecha = this.formatDate(c.startDate);
        const montoOriginal = this.formatMoney(principal);
        const pagadoFmt = this.formatMoney(pagado);
        const saldoFmt = this.formatMoney(saldoPendiente < 0 ? 0 : saldoPendiente);
        const fechaVenc = this.formatDate(c.dueDate);
        const diasAtraso = c.status === 'OVERDUE' ? this.getDaysLatenessNum(c) : '';
        const estado = this.formatEstado(c.status);
        csv += [cliente, c.id, fecha, montoOriginal, pagadoFmt, saldoFmt, fechaVenc, diasAtraso, estado].join(sep) + '\r\n';
        totalOriginal += principal;
        totalPagado += pagado;
        totalSaldo += saldoPendiente < 0 ? 0 : saldoPendiente;
      });
      csv += `----------------------------------------${sep.repeat(5)}\r\n`;

      // Totales al final destacados
      csv += sep.repeat(9) + '\r\n';
      csv += [
        '★ TOTALES', '', '',
        this.formatMoney(totalOriginal),
        this.formatMoney(totalPagado),
        this.formatMoney(totalSaldo), '', '', ''
      ].join(sep) + '\r\n';
      csv += `========================================${sep.repeat(5)}\r\n`;

      // Agregar BOM para UTF-8 y crear archivo
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `creditos_${fecha}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.loading = false;
      this.showToast('CSV generado correctamente');
    }, 500);
  }

  formatMoney(value: number): string {
    return value == null ? '' : `$${value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  }

  getDaysLatenessNum(credit: any): number {
    if (credit.status !== 'OVERDUE') return 0;
    const today = new Date();
    const dueDate = new Date(credit.dueDate);
    return Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  formatEstado(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'ACTIVO';
      case 'OVERDUE': return 'VENCIDO';
      case 'mora-grave': return 'MORA GRAVE';
      case 'PAID': return 'PAGADO';
      case 'FORGIVEN': return 'PERDONADO';
      case 'REFINANCED': return 'REFINANCIADO';
      default: return status;
    }
  }

  showToast(msg: string): void {
    // Simple toast nativo, reemplazar por servicio si existe uno
    const toast = document.createElement('div');
    toast.textContent = msg;
    toast.style.position = 'fixed';
    toast.style.bottom = '30px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = '#28a745';
    toast.style.color = '#fff';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = '6px';
    toast.style.zIndex = '9999';
    toast.style.fontWeight = 'bold';
    document.body.appendChild(toast);
    setTimeout(() => document.body.removeChild(toast), 2500);
  }
}
