/**
 * Modelos del módulo de Proveedores
 * Sprint 8 - Gestión de Proveedores
 * Alineado con el backend SmartTrade-Back
 */

export type SupplierStatus = 'active' | 'inactive' | 'suspended';
export type BankAccountType = string;    // libre: 'ahorros' | 'corriente' | etc.

// Términos de pago aceptados por el backend
export type PaymentTerms =
  'contado' | 'credito_15' | 'credito_30' | 'credito_60' | 'credito_90';

// ─── Sub-entidades ─────────────────────────────────────────────────────────────

export interface SupplierContact {
  id?: number;
  name: string;
  position: string | null;
  phone: string | null;
  email: string | null;
  isPrimary?: boolean;
}

// ─── Entidad principal ────────────────────────────────────────────────────────

export interface Supplier {
  id: number;
  tradeName: string;           // nombre comercial → backend: tradeName
  legalName: string | null;
  ruc: string;                 // RUC/ID fiscal → backend: ruc
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  status: SupplierStatus;         // backend: status (active/inactive/suspended)
  // Calificaciones (campos exactos del backend)
  qualityRating: number | null;     // promedio calidad
  punctualityRating: number | null; // promedio puntualidad
  overallRating: number | null;     // calificación general → mostrar en lista/detalle
  evaluationsCount: number;         // total evaluaciones realizadas
  notes: string | null;
  // Datos bancarios (flat en el modelo backend)
  bankName: string | null;
  bankAccount: string | null;
  bankAccountType: string | null;
  paymentTerms: PaymentTerms | null;
  contacts: SupplierContact[];
  createdBy: number | null;
  updatedBy: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// ─── Estadísticas / Historial ─────────────────────────────────────────────────

export interface SupplierStats {
  totalPurchases: number;
  totalAmount: number;
  lastPurchaseDate: string | null;
  lastPurchaseAmount: number | null;
  purchasesLastMonth: number;
  onTimeDeliveryPercent: number;
  averageQualityRating: number | null;
}

export type PurchaseStatus = 'pending' | 'received' | 'partial' | 'cancelled';

export interface PurchaseRecord {
  id: number;
  orderNumber: string;
  date: string;
  amount: number;
  status: PurchaseStatus;
}

export interface SupplierPurchaseHistory {
  supplier: { id: number; tradeName: string };
  purchases: PurchaseRecord[];
  stats: SupplierStats;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ─── DTOs (campos exactos del backend) ───────────────────────────────────────

export interface CreateSupplierDto {
  tradeName: string;
  legalName?: string | null;
  ruc: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  paymentTerms?: PaymentTerms | null;
  bankName?: string | null;
  bankAccount?: string | null;
  bankAccountType?: string | null;
  notes?: string | null;
  contacts?: Omit<SupplierContact, 'id'>[];
}

export type UpdateSupplierDto = Partial<CreateSupplierDto>;

export interface ChangeStatusDto {
  status: SupplierStatus;
  reason?: string | null;
}

export interface EvaluateSupplierDto {
  qualityRating: number;
  punctualityRating: number;
  observations?: string | null;
  purchaseReference?: number | null;
}

// ─── Filtros y Respuestas de Lista ────────────────────────────────────────────

export interface SupplierFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: SupplierStatus;     // backend: status, no isActive
  minRating?: number;
}

export interface SupplierListResponse {
  suppliers: Supplier[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ─── Labels en español ────────────────────────────────────────────────────────

export const PAYMENT_TERMS_LABELS: Record<PaymentTerms, string> = {
  contado: 'Contado',
  credito_15: 'Crédito 15 días',
  credito_30: 'Crédito 30 días',
  credito_60: 'Crédito 60 días',
  credito_90: 'Crédito 90 días'
};

export const SUPPLIER_STATUS_LABELS: Record<SupplierStatus, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  suspended: 'Suspendido'
};

export const SUPPLIER_STATUS_BADGE: Record<SupplierStatus, string> = {
  active: 'bg-success-subtle text-success border border-success-subtle',
  inactive: 'bg-secondary-subtle text-secondary border border-secondary-subtle',
  suspended: 'bg-warning-subtle text-warning border border-warning-subtle'
};

export const PURCHASE_STATUS_LABELS: Record<PurchaseStatus, string> = {
  pending: 'Pendiente',
  received: 'Recibido',
  partial: 'Parcial',
  cancelled: 'Cancelado'
};

export const PURCHASE_STATUS_BADGE: Record<PurchaseStatus, string> = {
  pending: 'bg-warning text-dark',
  received: 'bg-success',
  partial: 'bg-info text-dark',
  cancelled: 'bg-danger'
};
