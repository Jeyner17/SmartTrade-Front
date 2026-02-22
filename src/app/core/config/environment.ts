/**
 * Configuración de Entorno
 * Sprint 2 - Autenticación y Autorización
 */

export const environment = {
  production: false,
  
  // API Configuration
  apiUrl: 'http://localhost:3000/api/v1',
  
  // Auth Configuration
  tokenKey: 'access_token',
  refreshTokenKey: 'refresh_token',
  userKey: 'current_user',
  permissionsKey: 'user_permissions',
  
  // Session Configuration
  rememberMeKey: 'remember_me',
  sessionTimeout: 120 * 60 * 1000, // 120 minutos en milisegundos
  
  // App Configuration
  appName: 'Sistema de Gestión Comercial',
  appVersion: '1.0.0'
};