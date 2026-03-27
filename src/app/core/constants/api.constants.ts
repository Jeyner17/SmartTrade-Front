/**
 * Constantes de API
 * Sistema de Gestión Comercial
 */

export const API_CONSTANTS = {
  BASE_URL: 'http://localhost:3000/api/v1',

  ENDPOINTS: {
    // Sprint 1: Settings
    SETTINGS: '/settings',
    SETTINGS_BY_TYPE: (type: string) => `/settings/${type}`,
    SETTINGS_LOGO: '/settings/logo',
    SETTINGS_BACKUP: '/settings/backup/configure',
    SETTINGS_TECHNICAL: '/settings/technical/parameters',

    // Sprint 2: Auth
    AUTH_LOGIN: '/auth/login',
    AUTH_LOGOUT: '/auth/logout',
    AUTH_LOGOUT_ALL: '/auth/logout-all',
    AUTH_REFRESH: '/auth/refresh',
    AUTH_PROFILE: '/auth/profile',
    AUTH_ME: '/auth/me',
    AUTH_CHECK: '/auth/check',
    AUTH_VERIFY_PERMISSION: '/auth/verify-permission',
    AUTH_CHANGE_PASSWORD: '/auth/change-password',

    // Sprint 2: Roles
    ROLES: '/roles',
    ROLES_BY_ID: (roleId: number) => `/roles/${roleId}`,
    ROLES_PERMISSIONS: (roleId: number) => `/roles/${roleId}/permissions`,
    ROLES_MODULES: (roleId: number) => `/roles/${roleId}/modules`,
    ROLES_CHECK_PERMISSION: (roleId: number) => `/roles/${roleId}/check-permission`,

    // Sprint 3: Usuarios
    USERS: '/users',
    USERS_BY_ID: (id: number) => `/users/${id}`,
    USERS_STATUS: (id: number) => `/users/${id}/status`,
    USERS_RESET_PASSWORD: (id: number) => `/users/${id}/reset-password`,
    USERS_SESSIONS: (id: number) => `/users/${id}/sessions`,
    USERS_LOGOUT_ALL: (id: number) => `/users/${id}/logout-all`,
    USERS_CHECK_AVAILABILITY: '/users/check-availability',
    USERS_ROLES: '/users/roles',

    // Sprint 4: Empleados
    EMPLOYEES: '/employees',
    EMPLOYEES_BY_ID: (id: number) => `/employees/${id}`,
    EMPLOYEES_LINK_USER: (id: number) => `/employees/${id}/link-user`,
    EMPLOYEES_ATTENDANCE: (id: number) => `/employees/${id}/attendance`,
    EMPLOYEES_ATTENDANCE_TODAY: (id: number) => `/employees/${id}/attendance/today`,

    // Sprint 5: Categorías
    CATEGORIES: '/categories',
    CATEGORIES_BY_ID: (id: number) => `/categories/${id}`,
    CATEGORIES_STATUS: (id: number) => `/categories/${id}/status`,
    CATEGORIES_PRODUCTS: (id: number) => `/categories/${id}/products`,

    // Sprint 6: Productos
    PRODUCTS: '/products',
    PRODUCTS_BY_ID: (id: number) => `/products/${id}`,
    PRODUCTS_STATUS: (id: number) => `/products/${id}/status`,
    PRODUCTS_PRICE: (id: number) => `/products/${id}/price`,
    PRODUCTS_IMAGE: (id: number) => `/products/${id}/image`,
    PRODUCTS_BARCODE: (code: string) => `/products/barcode/${code}`,

    // Sprint 7: Inventario
    INVENTORY: '/inventory',
    INVENTORY_ALERTS: '/inventory/alerts',
    INVENTORY_VALUE: '/inventory/value',
    INVENTORY_BY_ID: (id: number) => `/inventory/${id}`,
    INVENTORY_MOVEMENTS: (id: number) => `/inventory/${id}/movements`,
    INVENTORY_LIMITS: (id: number) => `/inventory/${id}/limits`,
    INVENTORY_MOVEMENT: '/inventory/movement',
    INVENTORY_ADJUST: '/inventory/adjust',

    // Sprint 8: Proveedores
    SUPPLIERS: '/suppliers',
    SUPPLIERS_BY_ID: (id: number) => `/suppliers/${id}`,
    SUPPLIERS_STATUS: (id: number) => `/suppliers/${id}/status`,
    SUPPLIERS_EVALUATE: (id: number) => `/suppliers/${id}/evaluate`,
    SUPPLIERS_PURCHASES: (id: number) => `/suppliers/${id}/purchases`,

     // Sprint 9: Compras
    PURCHASES: '/purchases',
    PURCHASES_BY_ID: (id: number) => `/purchases/${id}`,
    PURCHASES_STATUS: (id: number) => `/purchases/${id}/status`,
    PURCHASES_RECEIVE: (id: number) => `/purchases/${id}/receive`,
    PURCHASES_CANCEL: (id: number) => `/purchases/${id}/cancel`,
    PURCHASES_BY_SUPPLIER: (supplierId: number) => `/purchases/supplier/${supplierId}`,
    PURCHASES_REPORT: '/purchases/report',

    // Sprint 10: Recepción de Mercancía
    RECEPTIONS: '/receptions',
    RECEPTIONS_BY_ID: (id: number) => `/receptions/${id}`,
    RECEPTIONS_VERIFY_BARCODE: '/receptions/verify-barcode',
    RECEPTIONS_SCAN: (id: number) => `/receptions/${id}/scan`,
    RECEPTIONS_CONFIRM: (id: number) => `/receptions/${id}/confirm`,
    RECEPTIONS_DISCREPANCIES: (id: number) => `/receptions/${id}/discrepancies`,
    RECEPTIONS_DISCREPANCIES_LIST: '/receptions/discrepancies',
    RECEPTIONS_DISCREPANCY_RESOLVE: (id: number) => `/receptions/discrepancies/${id}/resolve`,
      RECEPTIONS_CONFIRMED_ORDERS: '/receptions/confirmed-orders',

    // Sprint 11: Códigos de Barra / QR
    BARCODES_SCAN:                    '/barcodes/scan/barcode',
    BARCODES_SCAN_QR:                 '/barcodes/scan/qr',
    BARCODES_VERIFY:                  '/barcodes/verify',
    BARCODES_GENERATE_QR:             '/barcodes/generate',
    BARCODES_LOGS:                    '/barcodes/logs',
    BARCODES_SCANNER_CONFIG:          '/barcodes/config',
    BARCODES_SCANNER_CONFIG_SAVE:     '/barcodes/config'
  },

  TIMEOUT: 30000 // 30 segundos
};

export type ConfigType = 'company' | 'fiscal' | 'business' | 'technical' | 'backup';
