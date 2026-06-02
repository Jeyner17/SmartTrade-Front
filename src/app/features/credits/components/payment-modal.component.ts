import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CreditsService } from '../services/credits.service';

@Component({
  selector: 'app-payment-modal',
  templateUrl: './payment-modal.component.html',
  styleUrls: ['./payment-modal.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class PaymentModalComponent implements OnInit, OnChanges {
  @Input() credit: any = null;
  @Output() closed = new EventEmitter<void>();
  @Output() paymentRegistered = new EventEmitter<void>();

  paymentForm!: FormGroup;
  loading = false;
  error: string | null = null;
  success: string | null = null;
  shouldPrintReceipt = false;
  paymentMethods = ['efectivo', 'transferencia', 'tarjeta'];

  constructor(private fb: FormBuilder, private creditsService: CreditsService) {}

  ngOnInit(): void {
    this.buildForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['credit'] && this.credit) {
      // Asegurar que credit siempre tenga lateInterest
      this.credit.lateInterest = this.credit.lateInterest || 0;
      this.credit.outstandingBalance = Number(this.credit.outstandingBalance) || 0;
      
      if (!changes['credit'].firstChange) {
        this.updateForm();
      } else {
        // Primera carga: inicializar con saldo total
        this.updateAmount();
      }
    }
  }

  buildForm(): void {
    this.paymentForm = this.fb.group({
      paymentType: ['total', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      paymentMethod: ['efectivo', Validators.required],
      paymentDate: [new Date().toISOString().substring(0, 10), Validators.required],
      notes: [''],
      printReceipt: [false]
    });

    this.paymentForm.get('paymentType')?.valueChanges.subscribe(() => {
      setTimeout(() => this.updateAmount(), 0);
    });
  }

  updateForm(): void {
    if (this.credit) {
      this.credit.lateInterest = this.credit.lateInterest || 0;
      this.credit.outstandingBalance = Number(this.credit.outstandingBalance) || 0;
      this.updateAmount();
    }
  }

  updateAmount(): void {
    if (!this.credit) return;
    
    if (this.paymentForm.value.paymentType === 'total') {
      const totalAmount = Number(this.credit.outstandingBalance || 0) + Number(this.credit.lateInterest || 0);
      this.paymentForm.patchValue({
        amount: totalAmount
      }, { emitEvent: false });
    }
  }

  calculateNewBalance(): number {
    if (!this.credit) return 0;
    const currentAmount = this.paymentForm?.value?.amount || 0;
    const current = Number(this.credit.outstandingBalance || 0) + Number(this.credit.lateInterest || 0);
    return Math.max(0, current - currentAmount);
  }

  validateAmount(): string | null {
    if (!this.credit) return 'Datos del crédito no disponibles';
    
    const amount = this.paymentForm?.value?.amount || 0;
    const maxAmount = Number(this.credit.outstandingBalance || 0) + Number(this.credit.lateInterest || 0);
    
    if (amount > maxAmount) {
      return `El monto no puede ser mayor a $${maxAmount.toFixed(2)}`;
    }
    if (amount <= 0) {
      return 'El monto debe ser mayor a 0';
    }
    return null;
  }

  private buildReceiptHtml(paymentData: any): string {
    const previousBalance = Number(this.credit?.outstandingBalance || 0) + Number(this.credit?.lateInterest || 0);
    const newBalance = Math.max(0, previousBalance - Number(paymentData.amountPaid || 0));
    const formattedAmount = Number(paymentData.amountPaid || 0).toFixed(2);
    const formattedPrev = previousBalance.toFixed(2);
    const formattedNew = newBalance.toFixed(2);

    return `
      <div style="font-family: Arial, sans-serif; color: #222; width: 100%; max-width: 800px; margin: 0 auto; padding: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <div>
            <div style="font-size: 18px; font-weight: 700; letter-spacing: 1px;">SMART TRADE</div>
            <div style="font-size: 14px; color: #6c757d;">Sistema de Gestión Comercial</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 12px; color: #6c757d;">Fecha</div>
            <div style="font-size: 16px; font-weight: 700;">${paymentData.paymentDate}</div>
          </div>
        </div>

        <div style="background: #f1f5f9; padding: 18px; border-radius: 10px; margin-bottom: 24px;">
          <div style="font-size: 12px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px;">COMPROBANTE DE PAGO</div>
          <div style="font-size: 24px; font-weight: 700; color: #0b3b66;">Factura de pago</div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 24px;">
          <div style="padding: 18px; background: #ffffff; border: 1px solid #dee2e6; border-radius: 10px;">
            <div style="font-size: 12px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px;">Cliente</div>
            <div style="font-size: 16px; font-weight: 700;">${this.credit?.customer?.fullName || 'N/A'}</div>
            <div style="font-size: 14px; color: #495057; margin-top: 8px;">Crédito #${this.credit?.id}</div>
          </div>
          <div style="padding: 18px; background: #ffffff; border: 1px solid #dee2e6; border-radius: 10px;">
            <div style="font-size: 12px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px;">Método de pago</div>
            <div style="font-size: 16px; font-weight: 700; text-transform: capitalize;">${paymentData.paymentMethod}</div>
            <div style="font-size: 12px; color: #6c757d; margin-top: 10px;">Estado del pago: <strong>PAGADO</strong></div>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <tbody>
            <tr>
              <td style="padding: 14px 0; border-bottom: 1px solid #e9ecef; width: 35%; color: #6c757d;">Monto pagado</td>
              <td style="padding: 14px 0; border-bottom: 1px solid #e9ecef; font-weight: 700; text-align: right;">$${formattedAmount}</td>
            </tr>
            <tr>
              <td style="padding: 14px 0; border-bottom: 1px solid #e9ecef; color: #6c757d;">Saldo anterior</td>
              <td style="padding: 14px 0; border-bottom: 1px solid #e9ecef; font-weight: 700; text-align: right;">$${formattedPrev}</td>
            </tr>
            <tr>
              <td style="padding: 14px 0; border-bottom: 1px solid #e9ecef; color: #6c757d;">Nuevo saldo</td>
              <td style="padding: 14px 0; font-weight: 700; text-align: right;">$${formattedNew}</td>
            </tr>
          </tbody>
        </table>

        <div style="padding: 18px; background: #ffffff; border: 1px solid #dee2e6; border-radius: 10px;">
          <div style="font-size: 12px; color: #6c757d; margin-bottom: 8px;">Observaciones</div>
          <div style="font-size: 14px; color: #495057;">${paymentData.notes ? paymentData.notes : 'Ninguna'}</div>
        </div>

        <div style="margin-top: 32px; font-size: 12px; color: #6c757d; text-align: center;">Gracias por su pago. Esta factura sirve como comprobante válido de la transacción.</div>
      </div>
    `;
  }

  private printReceiptDocument(paymentData: any): void {
    const printContainerId = 'payment-receipt-print-container';
    const styleId = 'payment-receipt-print-style';
    const existingContainer = document.getElementById(printContainerId);
    const existingStyle = document.getElementById(styleId);

    if (existingContainer) {
      existingContainer.remove();
    }
    if (existingStyle) {
      existingStyle.remove();
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      @media print {
        body.printing * { visibility: hidden !important; }
        #${printContainerId}, #${printContainerId} * { visibility: visible !important; }
        #${printContainerId} { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; padding: 0 !important; margin: 0 auto !important; }
      }
    `;

    const container = document.createElement('div');
    container.id = printContainerId;
    container.innerHTML = this.buildReceiptHtml(paymentData);

    document.head.appendChild(style);
    document.body.appendChild(container);
    document.body.classList.add('printing');

    const cleanup = () => {
      document.body.classList.remove('printing');
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
      window.removeEventListener('afterprint', cleanup);
      this.paymentRegistered.emit();
      this.onCancel();
    };

    window.addEventListener('afterprint', cleanup);
    window.print();
    setTimeout(() => {
      if (document.body.classList.contains('printing')) {
        cleanup();
      }
    }, 1000);
  }

  onSubmit(): void {
    this.error = null;
    this.success = null;

    const amountError = this.validateAmount();
    if (amountError) {
      this.error = amountError;
      return;
    }

    if (this.paymentForm.invalid) return;

    this.loading = true;
    const formValue = this.paymentForm.value;
    this.shouldPrintReceipt = formValue.printReceipt;
    const paymentData = {
      amountPaid: formValue.amount,
      paymentMethod: formValue.paymentMethod,
      paymentDate: formValue.paymentDate,
      notes: formValue.notes
    };

    this.creditsService.registerPayment(this.credit.id, paymentData).subscribe({
      next: () => {
        this.loading = false;
        this.success = 'Pago registrado exitosamente';

        if (this.shouldPrintReceipt) {
          this.printReceiptDocument(paymentData);
        } else {
          setTimeout(() => {
            this.paymentRegistered.emit();
            this.onCancel();
          }, 1500);
        }
      },
      error: err => {
        this.loading = false;
        this.error = err.error?.message || 'Error al registrar pago';
      }
    });
  }

  onCancel(): void {
    this.paymentForm.reset();
    this.error = null;
    this.success = null;
    this.closed.emit();
  }
}
