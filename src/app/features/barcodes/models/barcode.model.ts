/**
 * Modelos del módulo de Códigos de Barra / QR
 * Sprint 11 - Sistema de Escaneo SmartTrade
 */

// ─── Resultado de escaneo ────────────────────────────────────────────────────

export interface ScannedProduct {
  id: number;
  name: string;
  barcode: string;
  price: number;
  stock: number;
  unit: string;
  category: string;
  imageUrl?: string | null;
  isLowStock?: boolean;
}

export interface ScanResult {
  success: boolean;
  product?: ScannedProduct;
  message?: string;
  scannedAt: string;
}

// Historial local de escaneos (pantalla 1)
export interface ScanHistoryItem {
  barcode: string;
  product: ScannedProduct;
  scannedAt: Date;
}

// ─── Generador de QR ─────────────────────────────────────────────────────────

// Tipos que acepta el backend: 'producto' | 'factura' | 'credito'
export type QrType = 'producto' | 'factura' | 'credito';
export type QrSize = 'small' | 'medium' | 'large';

// Mapeo de tamaño a pixels (backend espera options.width como entero)
export const QR_SIZE_WIDTH: Record<QrSize, number> = {
  small:  150,
  medium: 300,
  large:  500
};

export interface GenerateQrDto {
  type: QrType;
  data: Record<string, unknown>;
  options?: {
    width?: number;                    // backend usa width, no size
    errorCorrectionLevel?: 'L'|'M'|'Q'|'H';
    color?: string;
    includeLogo?: boolean;
  };
}

export interface QrResult {
  qrBase64: string;     // imagen PNG en base64
  type: QrType;
  content: string;
  generatedAt: string;
}

// ─── Configuración del Escáner ───────────────────────────────────────────────

export type ScannerType = 'usb' | 'camera' | 'both';
export type BarcodeFormat = 'EAN-13' | 'UPC' | 'Code-128' | 'QR' | 'all';
export type CameraFacing = 'front' | 'back';
export type CameraResolution = 'low' | 'medium' | 'high' | 'hd';

export interface ScannerConfig {
  deviceType: ScannerType;
  barcodeFormat: BarcodeFormat;
  soundEnabled: boolean;
  soundVolume: number;           // 0-100
  autoAddToCart: boolean;
  confirmBeforeAdd: boolean;
  scanDelay: number;             // ms entre escaneos
  cameraFacing: CameraFacing;
  cameraResolution: CameraResolution;
  autoLighting: boolean;
}

export interface ScannerConfigResponse {
  config: ScannerConfig;
  updatedAt: string;
}

// ─── Conteo de Inventario ────────────────────────────────────────────────────

export type InventoryCountStatus = 'active' | 'paused' | 'completed' | 'cancelled';

export interface CreateInventoryCountDto {
  name: string;
  categoryId?: number | null;
}

export interface InventoryCountItem {
  productId: number;
  productName: string;
  barcode: string;
  scannedQuantity: number;
  systemStock: number;
  difference: number;           // scannedQuantity - systemStock
  unit: string;
}

export interface InventoryCountSession {
  id: number;
  name: string;
  status: InventoryCountStatus;
  categoryId?: number | null;
  items: InventoryCountItem[];
  totalUniqueProducts: number;
  totalUnitsScanned: number;
  totalDiscrepancies: number;
  startedAt: string;
  finishedAt?: string | null;
}

export interface FinalizeCountResult {
  session: InventoryCountSession;
  adjustmentCreated?: boolean;
  adjustmentId?: number | null;
  message: string;
}

// ─── Labels útiles ───────────────────────────────────────────────────────────

export const QR_TYPE_LABELS: Record<QrType, string> = {
  producto: 'Producto',
  factura:  'Factura',
  credito:  'Crédito'
};

export const QR_SIZE_LABELS: Record<QrSize, string> = {
  small: 'Pequeño (150px)',
  medium: 'Mediano (300px)',
  large: 'Grande (500px)'
};

export const SCANNER_TYPE_LABELS: Record<ScannerType, string> = {
  usb: 'Escáner Físico USB',
  camera: 'Cámara',
  both: 'Ambos'
};

export const BARCODE_FORMAT_LABELS: Record<BarcodeFormat, string> = {
  'EAN-13': 'EAN-13',
  'UPC': 'UPC',
  'Code-128': 'Code-128',
  'QR': 'Código QR',
  'all': 'Todos los formatos'
};

export const CAMERA_RESOLUTION_LABELS: Record<CameraResolution, string> = {
  low:    'Baja (320x240)',
  medium: 'Media (640x480)',
  high:   'Alta (1280x720)',
  hd:     'HD (1920x1080)'
};

export const DEFAULT_SCANNER_CONFIG: ScannerConfig = {
  deviceType: 'usb',
  barcodeFormat: 'all',
  soundEnabled: true,
  soundVolume: 70,
  autoAddToCart: true,
  confirmBeforeAdd: false,
  scanDelay: 500,
  cameraFacing: 'back',
  cameraResolution: 'high',
  autoLighting: true
};
