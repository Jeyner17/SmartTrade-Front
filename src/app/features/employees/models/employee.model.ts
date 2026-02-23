/**
 * Modelos del módulo de Empleados
 * Sprint 4 - Gestión de Empleados
 */

export type DocumentType   = 'cedula' | 'pasaporte' | 'ruc';
export type EmployeeArea   = 'administracion' | 'caja' | 'bodega' | 'atencion' | 'ventas';
export type EmployeeShift  = 'morning' | 'afternoon' | 'night';
export type AttendanceType = 'entry' | 'exit';
export type AttendanceStatus = 'absent' | 'present' | 'completed';

export interface LinkedUser {
  id: number;
  username: string;
  email: string;
}

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  documentType: DocumentType;
  documentNumber: string;
  birthDate: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  area: EmployeeArea;
  shift: EmployeeShift;
  salary: number | null;
  hireDate: string | null;
  userId: number | null;
  linkedUser: LinkedUser | null;
  isActive: boolean;
  createdBy: number | null;
  updatedBy: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface AttendanceRecord {
  id: number;
  employeeId: number;
  date: string;
  entryTime: string | null;
  exitTime: string | null;
  totalHours: number | null;
  notes: string | null;
  registeredBy: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface TodayAttendance {
  status: AttendanceStatus;
  nextAction: AttendanceType | null;
  record: AttendanceRecord | null;
}

export interface AttendanceSummary {
  totalDaysWorked: number;
  totalHours: number;
}

export interface AttendanceHistory {
  employee: { id: number; fullName: string };
  records: AttendanceRecord[];
  summary: AttendanceSummary;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreateEmployeeDto {
  firstName: string;
  lastName: string;
  documentType: DocumentType;
  documentNumber: string;
  birthDate?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  area: EmployeeArea;
  shift: EmployeeShift;
  salary?: number | null;
  hireDate?: string | null;
  userId?: number | null;
  isActive?: boolean;
}

export type UpdateEmployeeDto = Partial<CreateEmployeeDto>;

export interface EmployeeFilters {
  page?: number;
  limit?: number;
  search?: string;
  area?: EmployeeArea;
  shift?: EmployeeShift;
  isActive?: boolean;
}

export interface EmployeeListResponse {
  employees: Employee[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ─── Labels en español ──────────────────────────────────────────────────────

export const AREA_LABELS: Record<EmployeeArea, string> = {
  administracion: 'Administración',
  caja:           'Caja',
  bodega:         'Bodega',
  atencion:       'Atención al Cliente',
  ventas:         'Ventas'
};

export const SHIFT_LABELS: Record<EmployeeShift, string> = {
  morning:   'Mañana',
  afternoon: 'Tarde',
  night:     'Noche'
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  cedula:    'Cédula',
  pasaporte: 'Pasaporte',
  ruc:       'RUC'
};

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  absent:    'Sin registro',
  present:   'En turno',
  completed: 'Completado'
};
