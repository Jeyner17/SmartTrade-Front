import { CreditPayment } from './payment.model';

export interface Credit {
  id: number;
  customerId: number;
  saleId: number;
  principalAmount: number;
  interestRate: number;
  moraRateDaily: number;
  termDays: number;
  startDate: string;
  dueDate: string;
  outstandingBalance: number;
  status: 'ACTIVE' | 'PAID' | 'OVERDUE' | 'FORGIVEN' | 'REFINANCED';
  observations?: string;
  lastPaymentDate?: string;
  createdAt?: string;
  updatedAt?: string;
  // Datos calculados/relacionados
  customer?: any;
  payments?: CreditPayment[];
  daysLate?: number;
  lateInterest?: number;
  totalAmount?: number;
}