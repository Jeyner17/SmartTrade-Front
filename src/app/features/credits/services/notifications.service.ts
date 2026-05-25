import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private api = '/api/v1/notifications';
  constructor(private http: HttpClient) {}

  sendReminder(credit: any, channel?: 'EMAIL' | 'SMS'): Observable<any> {
    const recipient = credit?.customer?.email
      ? {
          email: credit.customer.email,
          name: credit.customer.fullName
        }
      : credit?.customer?.phone
        ? {
            phone: credit.customer.phone,
            name: credit.customer.fullName
          }
        : null;

    if (!recipient) {
      return throwError(() => new Error('El cliente no tiene email ni teléfono para enviar el recordatorio'));
    }

    const selectedChannel = channel || (recipient.email ? 'EMAIL' : 'SMS');
    const finalRecipient = selectedChannel === 'EMAIL'
      ? { email: recipient.email || credit?.customer?.email, name: recipient.name }
      : { phone: recipient.phone || credit?.customer?.phone, name: recipient.name };

    const dueDate = credit?.dueDate ? new Date(credit.dueDate).toLocaleDateString() : 'N/A';
    const total = Number(credit?.totalAmount ?? credit?.outstandingBalance ?? 0).toFixed(2);

    return this.http.post(`${this.api}/send`, {
      recipient: finalRecipient,
      channel: selectedChannel,
      priority: 'NORMAL',
      subject: `Recordatorio de pago - Crédito #${credit?.id}`,
      body: `Hola ${credit?.customer?.fullName || 'cliente'}, te recordamos que tu crédito #${credit?.id} tiene un saldo pendiente de $${total} y vence el ${dueDate}.`,
      metadata: {
        creditId: credit?.id,
        customerId: credit?.customerId,
        dueDate: credit?.dueDate,
        outstandingBalance: credit?.outstandingBalance
      }
    });
  }

  sendStatementByEmail(email: string, customerName?: string, customerId?: number | string): Observable<any> {
    if (!email) {
      return throwError(() => new Error('El cliente no tiene email para enviar el estado de cuenta'));
    }

    return this.http.post(`${this.api}/send`, {
      recipient: { email, name: customerName || null },
      channel: 'EMAIL',
      priority: 'NORMAL',
      subject: 'Estado de cuenta',
      body: 'Adjunto estado de cuenta.',
      metadata: { customerId }
    });
  }
}
