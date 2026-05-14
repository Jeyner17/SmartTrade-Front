/**
 * Modelos del módulo Gastos Operativos
 * Sprint 16 - SmartTrade
 */

export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'BANK';
export type CategoryType = 'FIXED' | 'VARIABLE';
export type RecurringFrequency = 'MONTHLY' | 'BIWEEKLY' | 'WEEKLY';

// ─── Categoría ────────────────────────────────────────────────────────────────
export interface ExpenseCategory {
  id: number;
  name: string;
  description?: string;
  type: CategoryType;
  createdAt?: string;
  updatedAt?: string;
  // Campos calculados (from reports)
  expenseCount?: number;
  totalLastMonth?: number;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  type: CategoryType;
}

// ─── Gasto ────────────────────────────────────────────────────────────────────
export interface Expense {
  id: number;
  amount: number;
  categoryId: number;
  concept: string;
  date: string;
  paymentMethod: PaymentMethod;
  receiptNumber?: string;
  supplierId?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  // Relaciones
  category?: ExpenseCategory;
  receipts?: ExpenseReceipt[];
  supplier?: { id: number; name: string };
  createdByUser?: { id: number; username: string; fullName?: string };
}

export interface CreateExpenseDto {
  amount: number;
  categoryId: number;
  concept: string;
  date: string;
  paymentMethod: PaymentMethod;
  receiptNumber?: string;
  supplierId?: number;
  notes?: string;
  deductFromCash?: boolean;
}

export interface UpdateExpenseDto extends Partial<CreateExpenseDto> {}

// ─── Comprobante ──────────────────────────────────────────────────────────────
export interface ExpenseReceipt {
  id: number;
  expenseId: number;
  fileUrl: string;
  fileName?: string;
  mimeType?: string;
}

// ─── Gasto Recurrente ─────────────────────────────────────────────────────────
export interface ExpenseRecurring {
  id: number;
  amount: number;
  categoryId: number;
  concept: string;
  frequency: RecurringFrequency;
  startDate: string;
  nextDate?: string;
  active: boolean;
  createdAt?: string;
  // Relaciones
  category?: ExpenseCategory;
}

export interface CreateRecurringDto {
  amount: number;
  categoryId: number;
  concept: string;
  frequency: RecurringFrequency;
  startDate: string;
}

// ─── Filtros y paginación ─────────────────────────────────────────────────────
export interface ExpenseFilters {
  startDate?: string;
  endDate?: string;
  categoryId?: number;
  supplierId?: number;
  paymentMethod?: PaymentMethod | '';
  page?: number;
  limit?: number;
}

export interface ExpenseListResponse {
  rows: Expense[];
  count: number;
  page: number;
  limit: number;
}

// ─── Reportes ─────────────────────────────────────────────────────────────────
export interface ExpenseByCategoryItem {
  category: ExpenseCategory;
  total: number;
  percentage?: number;
  count?: number;
}

export interface ExpenseTotalReport {
  total: number;
  avgDaily: number;
}

// ─── UI helpers ───────────────────────────────────────────────────────────────
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  TRANSFER: 'Transferencia',
  BANK: 'Cheque/Banco'
};

export const PAYMENT_METHOD_ICONS: Record<PaymentMethod, string> = {
  CASH: 'bi-cash-coin',
  CARD: 'bi-credit-card',
  TRANSFER: 'bi-bank',
  BANK: 'bi-file-earmark-text'
};

export const PAYMENT_METHOD_COLORS: Record<PaymentMethod, string> = {
  CASH: 'success',
  CARD: 'info',
  TRANSFER: 'primary',
  BANK: 'warning'
};

export const CATEGORY_TYPE_LABELS: Record<CategoryType, string> = {
  FIXED: 'Fijo',
  VARIABLE: 'Variable'
};

export const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  MONTHLY: 'Mensual',
  BIWEEKLY: 'Quincenal',
  WEEKLY: 'Semanal'
};

export const SUGGESTED_CATEGORIES: Partial<ExpenseCategory>[] = [
  { name: 'Servicios Básicos', description: 'Luz, agua, internet, gas', type: 'FIXED' },
  { name: 'Alquiler / Arrendamiento', description: 'Renta del local', type: 'FIXED' },
  { name: 'Mantenimiento', description: 'Reparaciones y mantenimiento', type: 'VARIABLE' },
  { name: 'Limpieza', description: 'Productos e insumos de limpieza', type: 'VARIABLE' },
  { name: 'Seguridad', description: 'Vigilancia y seguridad', type: 'FIXED' },
  { name: 'Publicidad y Marketing', description: 'Promociones y publicidad', type: 'VARIABLE' },
  { name: 'Transporte', description: 'Fletes, combustible y transporte', type: 'VARIABLE' },
  { name: 'Suministros de Oficina', description: 'Papelería y útiles', type: 'VARIABLE' },
  { name: 'Salarios y Nómina', description: 'Pago de empleados', type: 'FIXED' },
  { name: 'Impuestos', description: 'Impuestos y obligaciones fiscales', type: 'FIXED' },
  { name: 'Otros', description: 'Gastos varios no categorizados', type: 'VARIABLE' }
];
