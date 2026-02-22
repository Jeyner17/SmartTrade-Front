/**
 * Modelos de Settings
 * Sprint 1 - Configuración del Sistema
 */

export interface SystemConfiguration {
  company: CompanyConfig;
  fiscal: FiscalConfig;
  business: BusinessConfig;
  technical: TechnicalConfig;
  backup: BackupConfig;
}

export interface CompanyConfig {
  name: string;
  ruc: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
}

export interface FiscalConfig {
  country: string;
  currency: string;
  taxRegime: string;
  ivaPercentage: number;
}

export interface BusinessConfig {
  minStock: number;
  defaultCreditDays: number;
  maxDiscountPercentage: number;
}

export interface TechnicalConfig {
  sessionTimeoutMinutes: number;
  logRetentionDays: number;
  dateFormat: string;
  timeFormat: string;
}

export interface BackupConfig {
  enabled: boolean;
  frequency: string;
  time: string;
  lastBackup?: string;
  nextBackup?: string;
}

export interface ConfigurationResponse {
  type: string;
  config: any;
  lastUpdated: string;
}

export interface LogoUploadResponse {
  logoUrl: string;
  message: string;
}

export interface TechnicalParameters {
  sessionTimeout: number;
  logRetention: number;
  dateFormat: string;
  timeFormat: string;
}