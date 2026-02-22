/**
 * Modelos de Autenticación
 * Sprint 2 - Autenticación y Autorización
 */

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  permissions: UserPermissions;
  tokens: AuthTokens;
}

export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: Role;
}

export interface Role {
  id: number;
  name: string;
  description: string;
}

export interface UserPermissions {
  isAdmin: boolean;
  modules: string[];
  permissions: Record<string, string[]>;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface VerifyPermissionRequest {
  module: string;
  action: string;
}

export interface VerifyPermissionResponse {
  hasPermission: boolean;
  module: string;
  action: string;
}

export interface RoleInfo {
  id: number;
  name: string;
  description: string;
  permissions: Record<string, string[]>;
}

export interface ModuleAccess {
  module: string;
  actions: string[];
}

export interface UserProfile extends User {
  permissions: UserPermissions;
  accessibleModules: ModuleAccess[];
  isActive: boolean;
  lastLogin: string | null;
}