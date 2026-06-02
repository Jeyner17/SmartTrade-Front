export interface StatementCustomer {
  id: number;
  fullName: string;
  documentNumber: string;
  phone?: string;
  email?: string;
  creditLimit?: number;
  status?: string; // Opcional para visualización
  address?: string; // Opcional para visualización
}

export interface CustomerStatement {
  customer: StatementCustomer;
  totalDebt: number;
  activeCredits: any[];
  payments: any[];
  averageLateDays: number;
}
