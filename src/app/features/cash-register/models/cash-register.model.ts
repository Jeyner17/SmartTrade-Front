/**
 * Modelos del módulo de Gestión de Caja
 * Sprint 14 - SmartTrade
 */

// ─── Tipos y Enums ────────────────────────────────────────────────────────────

export type CashSessionStatus = 'open' | 'closed';
export type MovementType = 'sale' | 'income' | 'expense' | 'withdrawal' | 'opening';
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'check' | 'credit';

// ─── Denominaciones ───────────────────────────────────────────────────────────

export interface DenominationCount {
  denomination: number;
  label: string;
  type: 'bill' | 'coin';
  quantity: number;
  subtotal: number;
}

export const DENOMINATION_BILLS: Omit<DenominationCount, 'quantity' | 'subtotal'>[] = [
  { denomination: 100,  label: 'Billetes de $100', type: 'bill' },
  { denomination: 50,   label: 'Billetes de $50',  type: 'bill' },
  { denomination: 20,   label: 'Billetes de $20',  type: 'bill' },
  { denomination: 10,   label: 'Billetes de $10',  type: 'bill' },
  { denomination: 5,    label: 'Billetes de $5',   type: 'bill' },
  { denomination: 2,    label: 'Billetes de $2',   type: 'bill' },
  { denomination: 1,    label: 'Billetes de $1',   type: 'bill' }
];

export const DENOMINATION_COINS: Omit<DenominationCount, 'quantity' | 'subtotal'>[] = [
  { denomination: 1,    label: 'Monedas de $1.00',  type: 'coin' },
  { denomination: 0.50, label: 'Monedas de $0.50',  type: 'coin' },
  { denomination: 0.25, label: 'Monedas de $0.25',  type: 'coin' },
  { denomination: 0.10, label: 'Monedas de $0.10',  type: 'coin' },
  { denomination: 0.05, label: 'Monedas de $0.05',  type: 'coin' },
  { denomination: 0.01, label: 'Monedas de $0.01',  type: 'coin' }
];

export const DENOMINATION_ALL = [...DENOMINATION_BILLS, ...DENOMINATION_COINS];


// ─── Sesión de Caja ───────────────────────────────────────────────────────────

export interface CashSession {
  id: number;
  cashierName: string;
  cashierId: number;
  cashNumber: number;
  status: CashSessionStatus;
  openedAt: string;
  closedAt?: string | null;
  initialAmount: number;
  observations?: string | null;
}

// ─── Movimiento de Caja ───────────────────────────────────────────────────────

export interface CashMovement {
  id: number;
  sessionId: number;
  type: MovementType;
  concept: string;
  amount: number;
  paymentMethod: PaymentMethod;
  registeredAt: string;
  authorizedBy?: string | null;
  referenceId?: number | null;
}

// ─── Resumen / Estado de Caja ─────────────────────────────────────────────────

export interface CashSummary {
  session: CashSession;
  initialAmount: number;
  salesCash: number;
  salesCard: number;
  salesTransfer: number;
  salesCredit: number;
  additionalIncome: number;
  expenses: number;
  withdrawals: number;
  expectedCash: number;
  totalMovements: number;
  lastMovements: CashMovement[];
}

// ─── Arqueo ───────────────────────────────────────────────────────────────────

export interface CashArqueo {
  session: CashSession;
  summary: CashSummary;
  expectedCash: number;
  movements: {
    sales: CashMovement[];
    incomes: CashMovement[];
    expenses: CashMovement[];
    withdrawals: CashMovement[];
  };
}

// ─── Reporte de Cierre ────────────────────────────────────────────────────────

export interface CashCloseReport {
  session: CashSession;
  summary: CashSummary;
  physicalCount: DenominationCount[];
  physicalTotal: number;
  expectedTotal: number;
  difference: number;
  differenceType: 'surplus' | 'shortage' | 'exact';
  observations?: string | null;
  closedAt: string;
}

// ─── DTOs (Request Bodies) ────────────────────────────────────────────────────

export interface OpenCashDto {
  cashierId: number;
  cashNumber: number;
  initialAmount: number;
  denominationCount?: DenominationCount[];
  observations?: string;
}

export interface RegisterIncomeDto {
  sessionId: number;
  amount: number;
  concept: string;
  customConcept?: string;
  paymentMethod: PaymentMethod;
  observations?: string;
}

export interface RegisterExpenseDto {
  sessionId: number;
  amount: number;
  concept: string;
  customConcept?: string;
  voucherNumber?: string;
  authorizedBy?: number;
  supervisorPassword?: string;
  observations?: string;
}

export interface WithdrawalDto {
  sessionId: number;
  amount: number;
  receivedBy: string;
  authCode?: string;
  denominationCount?: DenominationCount[];
  observations?: string;
}

export interface CloseCashDto {
  sessionId: number;
  physicalCount: DenominationCount[];
  observations?: string;
  differenceExplanation?: string;
  supervisorId?: number;
}

export interface RegisterSaleDto {
  saleId: number;
  sessionId: number;
  paymentMethod: PaymentMethod;
  amount: number;
}

// ─── Filtros Historial ────────────────────────────────────────────────────────

export interface CashHistoryFilters {
  startDate?: string;
  endDate?: string;
  cashierId?: number;
  cashNumber?: number;
  withDifferences?: boolean;
  page?: number;
  limit?: number;
}

export interface CashHistoryItem {
  id: number;
  cashNumber: number;
  cashierName: string;
  openedAt: string;
  closedAt: string;
  durationMinutes: number;
  totalSales: number;
  difference: number;
  differenceType: 'surplus' | 'shortage' | 'exact';
}

// ─── Labels ───────────────────────────────────────────────────────────────────

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  sale:       'Venta',
  income:     'Ingreso',
  expense:    'Egreso',
  withdrawal: 'Retiro',
  opening:    'Apertura'
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash:     'Efectivo',
  card:     'Tarjeta',
  transfer: 'Transferencia',
  check:    'Cheque',
  credit:   'Crédito'
};

export const INCOME_CONCEPTS = [
  { value: 'credit_payment', label: 'Pago de crédito' },
  { value: 'refund',         label: 'Devolución' },
  { value: 'other',          label: 'Otro ingreso' }
];

export const EXPENSE_CONCEPTS = [
  { value: 'bags',        label: 'Compra de bolsas' },
  { value: 'tips',        label: 'Propinas' },
  { value: 'maintenance', label: 'Mantenimiento menor' },
  { value: 'other',       label: 'Otro' }
];

export const EXPENSE_AUTH_LIMIT = 20; // Monto a partir del que requiere supervisor
export const MAX_CASH_IN_DRAWER = 200; // Efectivo máximo recomendado en caja
