/**
 * Modelos del módulo de Usuarios
 * Sprint 3 - Gestión de Usuarios
 */

export interface Role {
  id: number;
  name: string;
  description?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  roleId: number;
  role?: Role;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLogin: string | null;
  loginAttempts: number;
  lockUntil: string | null;
  createdBy: number | null;
  updatedBy: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface UserSession {
  id: number;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface UserListResponse {
  users: User[];
  pagination: PaginationMeta;
}

export interface CreateUserDto {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: number;
  password?: string;
  isActive?: boolean;
  mustChangePassword?: boolean;
}

export interface UpdateUserDto {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  roleId?: number;
  isActive?: boolean;
}

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  roleId?: number;
  isActive?: boolean;
}

export type UserStatus = 'active' | 'inactive' | 'unlock' | 'lock';

export interface AvailabilityResult {
  username?: { available: boolean; value: string };
  email?: { available: boolean; value: string };
}
