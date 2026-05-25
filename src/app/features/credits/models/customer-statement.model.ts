export interface StatementCustomer {
  id: number;
  fullName: string;
  documentNumber: string;
  phone?: string;
  email?: string;
  creditLimit?: number;
}

export interface CustomerStatement {
  customer: StatementCustomer;
  totalDebt: number;
  activeCredits: any[];
  payments: any[];
  averageLateDays: number;
}
