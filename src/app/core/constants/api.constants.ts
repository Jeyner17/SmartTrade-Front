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

    // Sprint 4: Empleados
    EMPLOYEES: '/employees',
    EMPLOYEES_BY_ID: (id: number) => `/employees/${id}`,
    EMPLOYEES_LINK_USER: (id: number) => `/employees/${id}/link-user`,
    EMPLOYEES_ATTENDANCE: (id: number) => `/employees/${id}/attendance`,
    EMPLOYEES_ATTENDANCE_TODAY: (id: number) => `/employees/${id}/attendance/today`
  },
  
  TIMEOUT: 30000 // 30 segundos
};

export type ConfigType = 'company' | 'fiscal' | 'business' | 'technical' | 'backup';