export interface CustomerStatement {
  customerId: string;
  name: string;
  document: string;
  contact: string;
  creditLimit: number;
  usedCredit: number;
  availableCredit: number;
  totalCredits: number;
  paidCredits: number;
  activeCredits: number;
  avgDaysToPay: number;
  rating: string;
  activeCreditsList: any[];
  paidCreditsList: any[];
}