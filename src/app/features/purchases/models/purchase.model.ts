export type PurchaseStatus = 'pendiente' | 'confirmada' | 'recibida' | 'cancelada';

export interface PurchaseSupplier {
  id: number;
  tradeName: string;
  ruc?: string;
  email?: string;
  phone?: string;
}

export interface PurchaseProduct {
  id: number;
  name: string;
  sku?: string;
  barcode?: string;
}

export interface PurchaseOrderLine {
  id: number;
  purchaseOrderId: number;
  productId: number;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
  lineTotal: number;
  notes?: string;
  product?: PurchaseProduct;
}

export interface PurchaseStatusHistory {
  id: number;
  purchaseOrderId: number;
  previousStatus: PurchaseStatus | null;
  newStatus: PurchaseStatus;
  notes?: string;
  changedAt: string;
  changedByUser?: {
    id: number;
    username: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface PurchaseOrder {
  id: number;
  orderNumber: string;
  supplierId: number;
  orderDate: string;
  expectedDeliveryDate?: string | null;
  status: PurchaseStatus;
  subtotal: number;
  ivaPercent?: number;
  ivaAmount?: number;
  totalAmount: number;
  notes?: string | null;
  statusObservations?: string | null;
  receivedAt?: string | null;
  cancelledAt?: string | null;
  supplier?: PurchaseSupplier;
  details?: PurchaseOrderLine[];
  statusHistory?: PurchaseStatusHistory[];
}

export interface PurchaseListItem {
  id: number;
  orderNumber: string;
  orderDate: string;
  supplier: PurchaseSupplier;
  totalAmount: number;
  status: PurchaseStatus;
  products: {
    count: number;
    quantity: number;
  };
}

export interface PurchasePagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PurchaseListResponse {
  orders: PurchaseListItem[];
  pagination: PurchasePagination;
}

export interface PurchaseFilters {
  page?: number;
  limit?: number;
  supplierId?: number | null;
  status?: PurchaseStatus | '';
  startDate?: string;
  endDate?: string;
}

export interface CreatePurchaseOrderProductDto {
  productId: number;
  quantity: number;
  unitCost: number;
}

export interface CreatePurchaseOrderDto {
  supplierId: number;
  expectedDeliveryDate?: string | null;
  observations?: string;
  products: CreatePurchaseOrderProductDto[];
}

export interface UpdatePurchaseOrderDto {
  supplierId?: number;
  expectedDeliveryDate?: string | null;
  observations?: string;
  products?: CreatePurchaseOrderProductDto[];
}

export interface ChangePurchaseStatusDto {
  newStatus: PurchaseStatus;
  observations?: string;
}

export interface ReceivePurchaseOrderDto {
  observations?: string;
  products?: Array<{
    productId: number;
    quantityReceived: number;
  }>;
}

export interface CancelPurchaseOrderDto {
  reason: string;
}

export const PURCHASE_STATUS_LABELS: Record<PurchaseStatus, string> = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  recibida: 'Recibida',
  cancelada: 'Cancelada'
};

export const PURCHASE_STATUS_BADGE: Record<PurchaseStatus, string> = {
  pendiente: 'bg-warning text-dark',
  confirmada: 'bg-primary',
  recibida: 'bg-success',
  cancelada: 'bg-danger'
};

export const CANCEL_REASON_OPTIONS: { value: string; label: string }[] = [
  { value: 'Cambio de proveedor', label: 'Cambio de proveedor' },
  { value: 'Error en orden', label: 'Error en orden' },
  { value: 'Productos no disponibles', label: 'Productos no disponibles' },
  { value: 'Otro', label: 'Otro' }
];
