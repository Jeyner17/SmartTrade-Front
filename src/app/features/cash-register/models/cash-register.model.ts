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
  { denomination: 1000, label: 'Billetes de $1000', type: 'bill' },
  { denomination: 500,  label: 'Billetes de $500',  type: 'bill' },
  { denomination: 200,  label: 'Billetes de $200',  type: 'bill' },
  { denomination: 100,  label: 'Billetes de $100',  type: 'bill' },
  { denomination: 50,   label: 'Billetes de $50',   type: 'bill' },
  { denomination: 20,   label: 'Billetes de $20',   type: 'bill' },
  { denomination: 10,   label: 'Billetes de $10',   type: 'bill' }
];

export const DENOMINATION_COINS: Omit<DenominationCount, 'quantity' | 'subtotal'>[] = [
  { denomination: 5,  label: 'Monedas de $5', type: 'coin' },
  { denomination: 2,  label: 'Monedas de $2', type: 'coin' },
  { denomination: 1,  label: 'Monedas de $1', type: 'coin' }
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
  receivedBy: number;
  authCode?: string;
  denominationCount?: DenominationCount[];
  observations?: string;
}

export interface CloseCashDto {
  sessionId: number;
  physicalCount: DenominationCount[];
  countedBy: number;
  verifiedBy?: number;
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
  status?: 'OPEN' | 'CLOSED' | 'COUNTED';
  page?: number;
  limit?: number;
}

export interface CashHistoryItem {
  id: number;
  cashNumber: number;
  cashierName: string;
  openedAt: string;
  closedAt: string | null;
  status: 'OPEN' | 'COUNTED' | 'CLOSED';
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
