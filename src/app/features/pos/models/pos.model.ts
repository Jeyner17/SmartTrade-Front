export type PosPaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia' | 'credito';
export type PosDiscountType = 'none' | 'percentage' | 'fixed';

export interface PosCustomer {
  id: number;
  fullName: string;
  documentNumber?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface PosCartItem {
  id: number;
  productId: number;
  product?: {
    id: number;
    name: string;
    sku?: string;
    barcode?: string;
    stock?: number;
    imageUrl?: string;
  };
  quantity: number;
  unitPrice: number;
  taxPercent: number;
  lineSubtotal: number;
}

export interface PosCartTotals {
  subtotal: number;
  iva: number;
  discountType: PosDiscountType;
  discountValue: number;
  discountAmount: number;
  total: number;
}

export interface PosCart {
  sessionId: number;
  status: 'open' | 'closed' | 'canceled';
  cashierId: number;
  customer: PosCustomer | null;
  discount: {
    type: PosDiscountType;
    value: number;
    reason?: string | null;
  };
  items: PosCartItem[];
  totals: PosCartTotals;
}

export interface PosSaleDetail {
  id: number;
  productId: number;
  product?: {
    id: number;
    name: string;
    sku?: string;
    barcode?: string;
  };
  quantity: number;
  unitPrice: number;
  taxPercent: number;
  lineSubtotal: number;
  lineTax: number;
  lineTotal: number;
}

export interface PosSale {
  id: number;
  ticketNumber: string;
  status: 'completed' | 'voided';
  paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia';
  subtotal: number;
  ivaAmount: number;
  discountType: PosDiscountType;
  discountValue: number;
  discountAmount: number;
  totalAmount: number;
  amountReceived: number;
  changeAmount: number;
  createdAt: string;
  notes?: string | null;
  voidReason?: string | null;
  voidedAt?: string | null;
  customer?: PosCustomer | null;
  cashier?: {
    id: number;
    username: string;
    firstName?: string;
    lastName?: string;
  };
  details?: PosSaleDetail[];
}

export interface PosTodaySaleSummary {
  id: number;
  ticketNumber: string;
  status: 'completed' | 'voided';
  paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia';
  subtotal: number;
  ivaAmount: number;
  discountAmount: number;
  totalAmount: number;
  createdAt: string;
  customer?: PosCustomer | null;
  cashier?: {
    id: number;
    username: string;
    firstName?: string;
    lastName?: string;
  };
  itemsCount: number;
}

export interface PopularProductItem {
  productId: number;
  soldQuantity: string | number;
  totalRevenue: string | number;
  product: {
    id: number;
    name: string;
    sku?: string;
    barcode?: string;
  };
}

export interface CreateSaleDto {
  products: Array<{ productId: number; quantity: number; unitPrice: number }>;
  discountType?: PosDiscountType;
  discountValue?: number;
  customerId?: number | null;
  paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia';
  amountReceived?: number;
  notes?: string;
}

export interface AddCartItemDto {
  sessionId?: number | null;
  productId: number;
  quantity?: number;
  customerId?: number | null;
}

export interface ApplyDiscountDto {
  discountType: PosDiscountType;
  value: number;
  reason?: string;
}

export interface ProcessPaymentDto {
  paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia';
  amountReceived?: number;
  customerId?: number | null;
  notes?: string;
}

export interface QuickCustomerDto {
  fullName: string;
  documentNumber?: string;
  phone?: string;
}
