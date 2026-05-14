export interface CreditPayment {
  id?: number;
  creditId: number;
  amount: number;
  paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia';
  paymentDate: string;
  notes?: string;
  recordedBy?: number;
  createdAt?: string;
  updatedAt?: string;
}