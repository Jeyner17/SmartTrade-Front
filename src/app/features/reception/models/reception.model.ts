export type ReceptionStatus = 'en_proceso' | 'parcial' | 'completa' | 'cancelada';
export type ReceptionDetailStatus = 'pendiente' | 'parcial' | 'completa' | 'exceso';
export type DiscrepancyType = 'faltante' | 'sobrante' | 'dañado' | 'otro';

export interface ReceptionSupplier {
  id: number;
  tradeName: string;
}

export interface ReceptionPurchaseOrder {
  id: number;
  orderNumber: string;
  expectedDeliveryDate?: string | null;
  supplier?: ReceptionSupplier;
}

export interface ReceptionProduct {
  id: number;
  name: string;
  sku?: string;
  barcode?: string;
}

export interface ReceptionDetail {
  id: number;
  receptionId: number;
  productId: number;
  quantityExpected: number;
  quantityReceived: number;
  status: ReceptionDetailStatus;
  unitPrice?: number;
  product?: ReceptionProduct;
}

export interface ReceptionDiscrepancy {
  id: number;
  receptionId: number;
  productId: number;
  quantityExpected: number;
  quantityReceived: number;
  type: DiscrepancyType;
  observations?: string;
  resolved: boolean;
  resolutionNotes?: string;
  createdAt: string;
  product?: ReceptionProduct;
  reception?: {
    id: number;
    receptionNumber: string;
    purchaseOrder?: ReceptionPurchaseOrder;
  };
}

export interface Reception {
  id: number;
  receptionNumber: string;
  purchaseOrderId: number;
  receptionDate: string;
  confirmedAt?: string | null;
  status: ReceptionStatus;
  totalExpected: number;
  totalReceived: number;
  itemsExpected: number;
  itemsReceived: number;
  hasDiscrepancies: boolean;
  observations?: string;
  createdAt: string;
  purchaseOrder?: ReceptionPurchaseOrder;
  details?: ReceptionDetail[];
  discrepancies?: ReceptionDiscrepancy[];
}

export interface ReceptionPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ReceptionListResponse {
  receptions: Reception[];
  pagination: ReceptionPagination;
}

export interface ReceptionFilters {
  page?: number;
  limit?: number;
  supplierId?: number | null;
  status?: ReceptionStatus | '';
  startDate?: string;
  endDate?: string;
}

export interface CreateReceptionDto {
  purchaseOrderId: number;
  receptionDate: string;
  observations?: string;
}

export interface VerifyBarcodeDto {
  purchaseOrderId: number;
  barcode: string;
}

export interface RegisterScanDto {
  productId: number;
  quantityScanned: number;
  notes?: string;
}

export interface ConfirmReceptionDto {
  observations?: string | null;
}

export interface ReportDiscrepancyDto {
  productId: number;
  quantityExpected?: number;
  quantityReceived?: number;
  type: DiscrepancyType;
  observations?: string;
}

export interface ResolveDiscrepancyDto {
  resolutionNotes: string;
}

export interface ReceptionProcessState {
  reception: Reception;
  progressPercent: number;
  scannedCount: number;
  totalCount: number;
  discrepanciesCount: number;
}

export const RECEPTION_STATUS_LABELS: Record<ReceptionStatus, string> = {
  en_proceso: 'En proceso',
  parcial: 'Parcial',
  completa: 'Completa',
  cancelada: 'Cancelada'
};

export const RECEPTION_STATUS_BADGE: Record<ReceptionStatus, string> = {
  en_proceso: 'bg-warning text-dark',
  parcial: 'bg-warning text-dark',
  completa: 'bg-success',
  cancelada: 'bg-danger'
};

export const DISCREPANCY_TYPE_LABELS: Record<DiscrepancyType, string> = {
  faltante: 'Faltante',
  sobrante: 'Sobrante',
  dañado: 'Producto dañado',
  otro: 'Otro'
};
