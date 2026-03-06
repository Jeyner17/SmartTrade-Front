/**
 * Modelos de Inventario
 * Sprint 7 - Gestión de Inventario
 */

// ============================================
// MODELS
// ============================================

export interface StockMovement {
  id: number;
  productId: number;
  product?: {
    id: number;
    name: string;
    sku?: string;
  };
  movementType: 'entrada' | 'salida' | 'ajuste' | 'inicial';
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  reason: string;
  notes?: string;
  referenceType?: string;
  referenceId?: number;
  performedBy: number;
  performedByUser?: {
    id: number;
    username: string;
    firstName?: string;
    lastName?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: number;
  name: string;
  sku?: string;
  barcode?: string;
  stock: number;
  minStock: number;
  maxStock?: number;
  location?: string;
  category?: {
    id: number;
    name: string;
  };
  updatedAt: string;
}

export interface ProductStock {
  product: {
    id: number;
    name: string;
    sku?: string;
    barcode?: string;
    stock: number;
    minStock: number;
    maxStock?: number;
    location?: string;
    price: number;
    cost?: number;
    updatedAt: string;
    category?: {
      id: number;
      name: string;
    };
  };
  stockStatus: {
    current: number;
    min: number;
    max?: number;
    difference: number;
    needsRestock: boolean;
  };
  alerts: Array<{
    type: 'danger' | 'warning' | 'info';
    message: string;
  }>;
}

export interface LowStockAlert {
  id: number;
  name: string;
  sku?: string;
  stock: number;
  minStock: number;
  maxStock?: number;
  deficit?: number;
  category?: {
    id: number;
    name: string;
  };
}

export interface InventoryValue {
  summary: {
    totalProducts: number;
    totalItems: number;
    totalCostValue: number;
    totalSaleValue: number;
    potentialProfit: number;
  };
  byCategory: {
    [categoryName: string]: {
      products: number;
      items: number;
      costValue: number;
      saleValue: number;
    };
  };
}

// ============================================
// DTOs
// ============================================

export interface InventoryFilters {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: number;
  lowStock?: boolean;
  outOfStock?: boolean;
}

export interface MovementFilters {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  movementType?: 'entrada' | 'salida' | 'ajuste' | 'inicial';
}

export interface RegisterMovementDto {
  productId: number;
  movementType: 'entrada' | 'salida';
  quantity: number;
  reason: string;
  notes?: string;
}

export interface AdjustInventoryDto {
  productId: number;
  newStock: number;
  reason: string;
  notes?: string;
}

export interface UpdateStockLimitsDto {
  minStock: number;
  maxStock?: number | null;
  location?: string | null;
}

// ============================================
// RESPONSES
// ============================================

export interface InventoryListResponse {
  inventory: InventoryItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface MovementHistoryResponse {
  movements: StockMovement[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface LowStockAlertsResponse {
  alerts: LowStockAlert[];
  summary: {
    total: number;
    outOfStock: number;
    critical: number;
    warning: number;
  };
}

export interface RegisterMovementResponse {
  movement: StockMovement;
  product: {
    id: number;
    name: string;
    stockBefore: number;
    stockAfter: number;
    difference: number;
  };
}

export interface AdjustInventoryResponse {
  adjustment: {
    productId: number;
    productName: string;
    stockBefore: number;
    stockAfter: number;
    difference: number;
    reason: string;
  };
  movement: StockMovement;
}

export interface UpdateStockLimitsResponse {
  product: {
    id: number;
    name: string;
    minStock: number;
    maxStock?: number;
    location?: string;
    currentStock: number;
  };
}

// ============================================
// ENUMS & CONSTANTS
// ============================================

export const MOVEMENT_TYPES = {
  ENTRADA: 'entrada',
  SALIDA: 'salida',
  AJUSTE: 'ajuste',
  INICIAL: 'inicial'
} as const;

export const MOVEMENT_REASONS = {
  COMPRA: 'compra',
  VENTA: 'venta',
  DEVOLUCION: 'devolucion',
  AJUSTE_INVENTARIO: 'ajuste_inventario',
  MERMA: 'merma',
  DONACION: 'donacion',
  PERDIDA: 'perdida',
  ROBO: 'robo',
  PRODUCTOS_DANADOS: 'productos_dañados',
  ERROR_REGISTRO: 'error_registro',
  INVENTARIO_FISICO: 'inventario_fisico',
  OTRO: 'otro'
} as const;

export const REASON_LABELS: { [key: string]: string } = {
  [MOVEMENT_REASONS.COMPRA]: 'Compra',
  [MOVEMENT_REASONS.VENTA]: 'Venta',
  [MOVEMENT_REASONS.DEVOLUCION]: 'Devolución',
  [MOVEMENT_REASONS.AJUSTE_INVENTARIO]: 'Ajuste de Inventario',
  [MOVEMENT_REASONS.MERMA]: 'Merma',
  [MOVEMENT_REASONS.DONACION]: 'Donación',
  [MOVEMENT_REASONS.PERDIDA]: 'Pérdida',
  [MOVEMENT_REASONS.ROBO]: 'Robo',
  [MOVEMENT_REASONS.PRODUCTOS_DANADOS]: 'Productos Dañados',
  [MOVEMENT_REASONS.ERROR_REGISTRO]: 'Error de Registro',
  [MOVEMENT_REASONS.INVENTARIO_FISICO]: 'Inventario Físico',
  [MOVEMENT_REASONS.OTRO]: 'Otro'
};

export type MovementType = typeof MOVEMENT_TYPES[keyof typeof MOVEMENT_TYPES];
export type MovementReason = typeof MOVEMENT_REASONS[keyof typeof MOVEMENT_REASONS];

// Razones organizadas por tipo de movimiento
export const MOVEMENT_REASONS_BY_TYPE = {
  entrada: [
    { value: MOVEMENT_REASONS.COMPRA, label: REASON_LABELS[MOVEMENT_REASONS.COMPRA] },
    { value: MOVEMENT_REASONS.DEVOLUCION, label: REASON_LABELS[MOVEMENT_REASONS.DEVOLUCION] },
    { value: MOVEMENT_REASONS.OTRO, label: REASON_LABELS[MOVEMENT_REASONS.OTRO] }
  ],
  salida: [
    { value: MOVEMENT_REASONS.VENTA, label: REASON_LABELS[MOVEMENT_REASONS.VENTA] },
    { value: MOVEMENT_REASONS.MERMA, label: REASON_LABELS[MOVEMENT_REASONS.MERMA] },
    { value: MOVEMENT_REASONS.DONACION, label: REASON_LABELS[MOVEMENT_REASONS.DONACION] },
    { value: MOVEMENT_REASONS.PERDIDA, label: REASON_LABELS[MOVEMENT_REASONS.PERDIDA] },
    { value: MOVEMENT_REASONS.ROBO, label: REASON_LABELS[MOVEMENT_REASONS.ROBO] },
    { value: MOVEMENT_REASONS.PRODUCTOS_DANADOS, label: REASON_LABELS[MOVEMENT_REASONS.PRODUCTOS_DANADOS] },
    { value: MOVEMENT_REASONS.OTRO, label: REASON_LABELS[MOVEMENT_REASONS.OTRO] }
  ]
};
