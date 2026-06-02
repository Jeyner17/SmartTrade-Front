import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CreditsService } from '../services/credits.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { DelinquentCustomer } from '../models/delinquent-customer.model';

@Component({
  selector: 'app-delinquent-customers',
  templateUrl: './delinquent-customers.component.html',
  styleUrls: ['./delinquent-customers.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class DelinquentCustomersComponent implements OnInit, OnDestroy {
  customers: any[] = [];
  allCustomers: any[] = [];
  loading = false;
  selectedCustomers: Set<number> = new Set();

  stats = {
    totalDebt: 0,
    delinquentCount: 0,
    avgDelayDays: 0
  };

  filters = {
    delayDays: '1-7',
    amountMin: 0,
    amountMax: 0,
    orderBy: 'dias'
  };

  delayRanges = [
    { value: '1-7', label: '1-7 días' },
    { value: '8-15', label: '8-15 días' },
    { value: '15-30', label: '15-30 días' },
    { value: '30+', label: 'Más de 30 días' }
  ];

  orderOptions = [
    { value: 'dias', label: 'Días de atraso' },
    { value: 'monto', label: 'Monto adeudado' }
  ];

  showActionModal = false;
  actionCustomerId: number | null = null;
  actionCustomerName = '';
  actionType = '';
  actionDescription = '';
  actionStatus = '';
  showBulkReminderModal = false;
  bulkReminderChannel: '1' | '2' | '' = '';

  actionTypeOptions = [
    { value: '1', label: 'Llamada' },
    { value: '2', label: 'SMS' },
    { value: '3', label: 'Email' },
    { value: '4', label: 'Visita' },
    { value: '5', label: 'Otro' }
  ];

  actionStatusOptions = [
    { value: '1', label: 'Éxito' },
    { value: '2', label: 'Sin respuesta' },
    { value: '3', label: 'Compromiso' },
    { value: '4', label: 'Rechazado' }
  ];

  bulkReminderOptions = [
    { value: '1', label: 'EMAIL' },
    { value: '2', label: 'SMS' }
  ];

  private destroy$ = new Subject<void>();

  constructor(private creditsService: CreditsService, private router: Router, private confirmation: ConfirmationService) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCustomers(): void {
    this.loading = true;
    this.selectedCustomers.clear();

    this.creditsService.getDelinquentCustomers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          // El backend retorna arreglo de objetos: { customer, totalOverdue, maxLateDays, credits }
          const customerData = response.data;
          const raw = Array.isArray(customerData) ? customerData : (customerData?.data || []);

          // Mapear a la interfaz que usa la UI
          this.allCustomers = raw.map((item: any) => ({
            id: item.customer?.id,
            name: item.customer?.fullName || item.customer?.name || '—',
            phone: item.customer?.phone || item.customer?.contact || '—',
            overdueCredits: Array.isArray(item.credits) ? item.credits.length : 0,
            totalDue: Number(item.totalOverdue || 0),
            avgDelayDays: Number(item.maxLateDays || 0),
            lastAction: item.lastAction || null,
            credits: item.credits || []
          }));

          this.applyFilters();
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  getMinDelayDays(): number {
    const range = this.filters.delayDays;
    if (range === '1-7') return 1;
    if (range === '8-15') return 8;
    if (range === '15-30') return 15;
    return 30;
  }

  calculateStats(): void {
    this.stats.delinquentCount = this.customers.length;
    this.stats.totalDebt = this.customers.reduce((sum, c) => sum + (c.totalDue || 0), 0);

    if (this.customers.length > 0) {
      const totalDelayDays = this.customers.reduce((sum, c) => sum + (c.avgDelayDays || 0), 0);
      this.stats.avgDelayDays = Math.round(totalDelayDays / this.customers.length);
    }
  }

  getDelayColor(customer: any): string {
    const days = customer.avgDelayDays || 0;
    if (days > 30) return 'rojo-intenso';
    if (days > 15) return 'rojo';
    if (days > 7) return 'naranja';
    return 'amarillo';
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  private applyFilters(): void {
    const minAmount = Number(this.filters.amountMin) || 0;
    const maxAmount = Number(this.filters.amountMax) || 0;
    const today = new Date();

    this.customers = this.allCustomers.filter((customer: any) => {
      const matchesAmountMin = minAmount <= 0 || customer.totalDue >= minAmount;
      const matchesAmountMax = maxAmount <= 0 || customer.totalDue <= maxAmount;
      const matchesDelay = this.matchesDelayRange(customer.avgDelayDays, this.filters.delayDays);
      return matchesAmountMin && matchesAmountMax && matchesDelay;
    });

    this.customers = this.sortCustomers(this.customers);
    this.calculateStats();
  }

  private matchesDelayRange(days: number, range: string): boolean {
    if (range === '1-7') {
      return days >= 1 && days <= 7;
    }
    if (range === '8-15') {
      return days >= 8 && days <= 15;
    }
    if (range === '15-30') {
      return days >= 16 && days <= 30;
    }
    if (range === '30+') {
      return days >= 31;
    }
    return true;
  }

  private sortCustomers(customers: any[]): any[] {
    if (this.filters.orderBy === 'monto') {
      return [...customers].sort((a, b) => (b.totalDue || 0) - (a.totalDue || 0));
    }

    return [...customers].sort((a, b) => (b.avgDelayDays || 0) - (a.avgDelayDays || 0));
  }

  toggleCustomer(customerId: number): void {
    if (this.selectedCustomers.has(customerId)) {
      this.selectedCustomers.delete(customerId);
    } else {
      this.selectedCustomers.add(customerId);
    }
  }

  isCustomerSelected(customerId: number): boolean {
    return this.selectedCustomers.has(customerId);
  }

  selectAll(): void {
    if (this.selectedCustomers.size === this.customers.length) {
      this.selectedCustomers.clear();
    } else {
      this.customers.forEach(c => this.selectedCustomers.add(c.id));
    }
  }

  callCustomer(phone: string): void {
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  }

  sendSMS(phone: string): void {
    if (phone) {
      // Abre cliente de SMS nativo del sistema
      window.location.href = `sms:${phone}?body=Recordatorio%20de%20pago%20de%20crédito%20vencido`;
    } else {
      this.confirmation.confirm({ title: 'Aviso', message: 'No hay número de teléfono disponible', confirmText: 'Aceptar', cancelText: '', type: 'info' }).subscribe();
    }
  }

  sendEmail(email: string): void {
    if (email) {
      // Abre cliente de email nativo del sistema
      const subject = 'Recordatorio de Pago';
      const body = 'Le recordamos que tiene créditos vencidos que requieren su atención. Por favor contacte con nosotros.';
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } else {
      this.confirmation.confirm({ title: 'Aviso', message: 'No hay correo electrónico disponible', confirmText: 'Aceptar', cancelText: '', type: 'info' }).subscribe();
    }
  }

  viewDetail(customerId: number): void {
    this.router.navigate(['/credits/estado-cuenta', customerId]);
  }

  openActionModal(customerId: number): void {
    this.actionCustomerId = customerId;
    const customer = this.customers.find(c => c.id === customerId);
    this.actionCustomerName = customer?.name || 'Cliente';
    this.actionType = '';
    this.actionDescription = '';
    this.actionStatus = '';
    this.showActionModal = true;
  }

  closeActionModal(): void {
    this.showActionModal = false;
    this.actionCustomerId = null;
  }

  submitAction(): void {
    if (!this.actionType || !this.actionDescription.trim() || !this.actionStatus) {
      this.confirmation.confirm({ title: 'Datos incompletos', message: 'Complete todos los campos para registrar la gestión.', confirmText: 'Aceptar', cancelText: '', type: 'warning' }).subscribe();
      return;
    }

    const actionTypeMap: any = {
      '1': 'llamada',
      '2': 'sms',
      '3': 'email',
      '4': 'visita',
      '5': 'otro'
    };

    const statusMap: any = {
      '1': 'éxito',
      '2': 'sin_respuesta',
      '3': 'compromiso',
      '4': 'rechazado'
    };

    this.confirmation.confirm({
      title: 'Confirmar gestión',
      message: `Registrar gestión de cobranza para ${this.actionCustomerName} como ${actionTypeMap[this.actionType]}?`,
      confirmText: 'Registrar',
      cancelText: 'Cancelar',
      type: 'info'
    }).subscribe(ok => {
      if (!ok) return;

      this.confirmation.confirm({
        title: 'Gestión registrada',
        message: `Gestión de cobro registrada exitosamente:\nTipo: ${actionTypeMap[this.actionType]}\nResultado: ${statusMap[this.actionStatus]}`,
        confirmText: 'Aceptar',
        cancelText: '',
        type: 'info'
      }).subscribe();

      console.log({
        customerId: this.actionCustomerId,
        actionType: actionTypeMap[this.actionType],
        description: this.actionDescription.trim(),
        status: statusMap[this.actionStatus]
      });

      this.closeActionModal();
    });
  }

  registerAction(customerId: number): void {
    this.openActionModal(customerId);
  }

  sendBulkReminder(): void {
    if (this.selectedCustomers.size === 0) {
      this.confirmation.confirm({ title: 'Aviso', message: 'Seleccione al menos un cliente', confirmText: 'Aceptar', cancelText: '', type: 'info' }).subscribe();
      return;
    }

    this.bulkReminderChannel = '';
    this.showBulkReminderModal = true;
  }

  closeBulkReminderModal(): void {
    this.showBulkReminderModal = false;
    this.bulkReminderChannel = '';
  }

  submitBulkReminder(): void {
    if (!['1', '2'].includes(this.bulkReminderChannel)) {
      this.confirmation.confirm({ title: 'Datos incompletos', message: 'Seleccione el canal de envío.', confirmText: 'Aceptar', cancelText: '', type: 'warning' }).subscribe();
      return;
    }

    const channelMap: any = { '1': 'EMAIL', '2': 'SMS' };

    this.confirmation.confirm({
      title: 'Enviar recordatorios',
      message: `¿Enviar recordatorio por ${channelMap[this.bulkReminderChannel]} a ${this.selectedCustomers.size} cliente(s)?`,
      confirmText: 'Enviar',
      cancelText: 'Cancelar',
      type: 'info'
    }).subscribe(ok => {
      if (!ok) return;

      this.confirmation.confirm({ title: 'Enviado', message: `${this.selectedCustomers.size} recordatorios enviados por ${channelMap[this.bulkReminderChannel]}`, confirmText: 'Aceptar', cancelText: '', type: 'info' }).subscribe();
      this.selectedCustomers.clear();
      this.closeBulkReminderModal();
    });
  }

  export(): void {
    if (this.customers.length === 0) {
      this.confirmation.confirm({ title: 'Aviso', message: 'No hay datos para exportar', confirmText: 'Aceptar', cancelText: '', type: 'info' }).subscribe();
      return;
    }

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const fecha = `${now.getFullYear()}_${pad(now.getMonth() + 1)}_${pad(now.getDate())}`;
    const hora = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const usuario = localStorage.getItem('userName') || 'Usuario';
    const sep = ';';
    let csv = '';

    csv += `========================================${sep.repeat(5)}\r\n`;
    csv += `★ SMART TRADE${sep.repeat(7)}\r\n`;
    csv += `► REPORTE DE CLIENTES MOROSOS${sep.repeat(3)}\r\n`;
    csv += `========================================${sep.repeat(5)}\r\n`;
    csv += `FECHA DE EXPORTACIÓN:${sep}${fecha} ${hora}${sep.repeat(6)}\r\n`;
    csv += `USUARIO:${sep}${usuario}${sep.repeat(7)}\r\n`;
    csv += sep.repeat(9) + '\r\n';

    csv += `---------- RESUMEN ----------${sep.repeat(5)}\r\n`;
    csv += `TOTAL DEUDA EN MORA:${sep}${this.formatMoney(this.stats.totalDebt)}${sep.repeat(5)}\r\n`;
    csv += `CLIENTES EN MORA:${sep}${this.stats.delinquentCount}${sep.repeat(7)}\r\n`;
    csv += `MORA PROMEDIO:${sep}${this.stats.avgDelayDays} días${sep.repeat(6)}\r\n`;
    csv += sep.repeat(9) + '\r\n';
    csv += `========================================${sep.repeat(5)}\r\n`;

    csv += [
      '**CLIENTE**',
      '**TELÉFONO**',
      '**CRÉDITOS VENCIDOS**',
      '**TOTAL ADEUDADO**',
      '**DÍAS ATRASO PROMEDIO**',
      '**ÚLTIMA GESTIÓN**'
    ].join(sep) + '\r\n';

    this.customers.forEach(c => {
      const cliente = (c.name || 'N/A').toString().replace(/\n|\r|;/g, ' ');
      const telefono = (c.phone || 'N/A').toString().replace(/\n|\r|;/g, ' ');
      const deuda = this.formatMoney(Number(c.totalDue) || 0);
      const dias = c.avgDelayDays != null ? c.avgDelayDays.toString() : '';
      const ultimaGestion = (c.lastAction || 'N/A').toString().replace(/\n|\r|;/g, ' ');
      csv += [cliente, telefono, c.overdueCredits, deuda, dias + ' días', ultimaGestion].join(sep) + '\r\n';
    });

    csv += `----------------------------------------${sep.repeat(5)}\r\n`;
    csv += sep.repeat(9) + '\r\n';
    csv += ['★ TOTALES', '', '', this.formatMoney(this.stats.totalDebt), '', ''].join(sep) + '\r\n';
    csv += `========================================${sep.repeat(5)}\r\n`;

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `clientes-morosos-${fecha}.csv`;
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    setTimeout(() => {
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
    }, 1000);
  }

  formatMoney(value: number): string {
    return value == null ? '' : `$${value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  goBack(): void {
    this.router.navigate(['/credits']);
  }
}
