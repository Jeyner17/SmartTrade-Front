import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CreditsService } from '../services/credits.service';
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

  private destroy$ = new Subject<void>();

  constructor(private creditsService: CreditsService, private router: Router) {}

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

    const params: any = {};
    if (this.filters.delayDays) params.minLateDays = this.getMinDelayDays();

    this.creditsService.getDelinquentCustomers(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
            // El backend retorna arreglo de objetos: { customer, totalOverdue, maxLateDays, credits }
            const customerData = response.data;
            const raw = Array.isArray(customerData) ? customerData : (customerData?.data || []);

            // Mapear a la interfaz que usa la UI
            this.customers = raw.map((item: any) => ({
              id: item.customer?.id,
              name: item.customer?.fullName || item.customer?.name || '—',
              phone: item.customer?.phone || item.customer?.contact || '—',
              overdueCredits: Array.isArray(item.credits) ? item.credits.length : 0,
              totalDue: Number(item.totalOverdue || 0),
              avgDelayDays: Number(item.maxLateDays || 0),
              lastAction: item.lastAction || null,
              credits: item.credits || []
            }));

            this.calculateStats();
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
    this.loadCustomers();
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
      alert('No hay número de teléfono disponible');
    }
  }

  sendEmail(email: string): void {
    if (email) {
      // Abre cliente de email nativo del sistema
      const subject = 'Recordatorio de Pago';
      const body = 'Le recordamos que tiene créditos vencidos que requieren su atención. Por favor contacte con nosotros.';
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } else {
      alert('No hay correo electrónico disponible');
    }
  }

  viewDetail(customerId: number): void {
    this.router.navigate(['/credits/estado-cuenta', customerId]);
  }

  registerAction(customerId: number): void {
    const action = prompt(
      'Tipo de acción realizada:\n1. Llamada\n2. SMS\n3. Email\n4. Visita\n5. Otro\n\nIngrese el número (1-5):'
    );

    if (action && ['1', '2', '3', '4', '5'].includes(action)) {
      const actionTypeMap: any = {
        '1': 'llamada',
        '2': 'sms',
        '3': 'email',
        '4': 'visita',
        '5': 'otro'
      };

      const description = prompt('Descripción de la gestión realizada:');

      if (description) {
        const status = prompt(
          'Resultado:\n1. Éxito\n2. Sin respuesta\n3. Compromiso\n4. Rechazado\n\nIngrese el número (1-4):'
        );

        if (status && ['1', '2', '3', '4'].includes(status)) {
          const statusMap: any = {
            '1': 'éxito',
            '2': 'sin_respuesta',
            '3': 'compromiso',
            '4': 'rechazado'
          };

          alert(`Gestión de cobro registrada exitosamente:\nTipo: ${actionTypeMap[action]}\nResultado: ${statusMap[status]}`);
          // Aquí se enviaría al backend si hubiera un endpoint
          console.log({
            customerId,
            actionType: actionTypeMap[action],
            description,
            status: statusMap[status]
          });
        }
      }
    }
  }

  sendBulkReminder(): void {
    if (this.selectedCustomers.size === 0) {
      alert('Seleccione al menos un cliente');
      return;
    }

    const channel = prompt(
      'Seleccione el canal de envío:\n1. EMAIL\n2. SMS\n\nIngrese el número (1 o 2):'
    );

    if (channel && ['1', '2'].includes(channel)) {
      const channelMap: any = { '1': 'EMAIL', '2': 'SMS' };

      if (confirm(
        `¿Enviar recordatorio por ${channelMap[channel]} a ${this.selectedCustomers.size} cliente(s)?`
      )) {
        alert(`${this.selectedCustomers.size} recordatorios enviados por ${channelMap[channel]}`);
        // Aquí se enviaría al backend si hubiera un endpoint para recordatorios masivos
        this.selectedCustomers.clear();
      }
    }
  }

  export(): void {
    if (this.customers.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    // Exportar a CSV
    const headers = ['Cliente', 'Teléfono', 'Créditos Vencidos', 'Total Adeudado', 'Días Atraso Promedio', 'Última Gestión'];
    const rows = this.customers.map(c => [
      c.name,
      c.phone,
      c.overdueCredits,
      c.totalDue,
      c.avgDelayDays,
      c.lastAction || 'N/A'
    ]);

    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `clientes-morosos-${new Date().toISOString().substring(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  goBack(): void {
    this.router.navigate(['/credits']);
  }
}
