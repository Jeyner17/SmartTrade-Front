import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreditCustomer } from '../models/credit-customer.model';
import { Credit } from '../models/credit.model';
import { CreditPayment } from '../models/payment.model';
import { DebtForgiveness } from '../models/debt-forgiveness.model';
import { CustomerStatement } from '../models/customer-statement.model';
import { DelinquentCustomer } from '../models/delinquent-customer.model';

@Injectable({ providedIn: 'root' })
export class CreditsService {
  private baseApi = '/api/v1/credits';
  private creditsApi = '/api/v1/credits/credits';

  constructor(private http: HttpClient) {}

  // Clientes de Crédito
  createCustomer(data: any): Observable<any> {
    return this.http.post(`${this.baseApi}/customers`, data);
  }

  getCustomers(params?: any): Observable<any> {
    return this.http.get(`${this.baseApi}/customers`, { params });
  }

  // Créditos
  createCredit(data: any): Observable<any> {
    return this.http.post(this.creditsApi, data);
  }

  getCredits(params?: any): Observable<any> {
    return this.http.get<any>(this.creditsApi, { params });
  }

  getCreditById(id: number | string): Observable<Credit> {
    return this.http.get<Credit>(`${this.creditsApi}/${id}`);
  }

  // Pagos
  registerPayment(creditId: number | string, data: any): Observable<any> {
    return this.http.post(`${this.creditsApi}/${creditId}/payments`, data);
  }

  // Recordatorios
  createReminder(creditId: number | string, data: any): Observable<any> {
    return this.http.post(`${this.creditsApi}/${creditId}/reminders`, data);
  }

  // Estado de Cuenta
  getCustomerStatement(customerId: number | string): Observable<CustomerStatement> {
    return this.http.get<CustomerStatement>(`${this.baseApi}/customers/${customerId}/statement`);
  }

  getCustomerCreditHistory(customerId: number | string, includePaid?: boolean): Observable<any> {
    return this.http.get(`${this.baseApi}/customers/${customerId}/credits/history`, {
      params: { includePaid: includePaid ? 'true' : 'false' }
    });
  }

  // Intereses por Mora
  calculateLateInterest(creditId: number | string): Observable<any> {
    return this.http.get(`${this.creditsApi}/${creditId}/late-interest`);
  }

  // Clientes Morosos
  getDelinquentCustomers(params?: any): Observable<any> {
    return this.http.get<any>(`${this.baseApi}/customers/delinquent`, { params });
  }

  // Condonación de Deuda
  forgiveDebt(creditId: number | string, data: DebtForgiveness): Observable<any> {
    return this.http.post(`${this.creditsApi}/${creditId}/forgive`, data);
  }

  // Refinanciamiento
  refinanceCredit(creditId: number | string, data: any): Observable<any> {
    return this.http.post(`${this.creditsApi}/${creditId}/refinance`, data);
  }
}
