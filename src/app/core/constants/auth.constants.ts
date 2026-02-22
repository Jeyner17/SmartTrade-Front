/**
 * Constantes de Autenticación
 * Sprint 2 - Autenticación y Autorización
 */

export const AUTH_CONSTANTS = {
  // Storage Keys
  STORAGE: {
    TOKEN_KEY: 'access_token',
    REFRESH_TOKEN_KEY: 'refresh_token',
    USER_KEY: 'current_user',
    PERMISSIONS_KEY: 'user_permissions',
    REMEMBER_ME_KEY: 'remember_me'
  },

  // Session
  SESSION: {
    TIMEOUT_MINUTES: 120,
    TIMEOUT_MS: 120 * 60 * 1000
  },

  // Módulos del sistema (sincronizado con backend)
  MODULES: {
    SETTINGS: 'settings',
    USERS: 'users',
    EMPLOYEES: 'employees',
    CATEGORIES: 'categories',
    PRODUCTS: 'products',
    INVENTORY: 'inventory',
    SUPPLIERS: 'suppliers',
    PURCHASES: 'purchases',
    RECEPTION: 'reception',
    BARCODES: 'barcodes',
    POS: 'pos',
    SALES: 'sales',
    INVOICING: 'invoicing',
    CASH_REGISTER: 'cash_register',
    CREDITS: 'credits',
    EXPENSES: 'expenses',
    FINANCE: 'finance',
    AUDIT: 'audit',
    NOTIFICATIONS: 'notifications',
    REPORTS: 'reports',
    ANALYTICS: 'analytics'
  },

  // Acciones sobre módulos (sincronizado con backend)
  ACTIONS: {
    VIEW: 'view',
    CREATE: 'create',
    EDIT: 'edit',
    DELETE: 'delete',
    EXPORT: 'export',
    PRINT: 'print'
  },

  // Roles del sistema
  ROLES: {
    ADMIN: 'Administrador',
    SUPERVISOR: 'Supervisor',
    CASHIER: 'Cajero',
    WAREHOUSE: 'Bodeguero',
    EMPLOYEE: 'Empleado'
  }
};

// Type helpers para TypeScript
export type ModuleName = typeof AUTH_CONSTANTS.MODULES[keyof typeof AUTH_CONSTANTS.MODULES];
export type ActionName = typeof AUTH_CONSTANTS.ACTIONS[keyof typeof AUTH_CONSTANTS.ACTIONS];
export type RoleName = typeof AUTH_CONSTANTS.ROLES[keyof typeof AUTH_CONSTANTS.ROLES];