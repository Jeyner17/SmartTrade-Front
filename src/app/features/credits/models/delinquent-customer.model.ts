export interface DelinquentCustomer {
  id: string;
  name: string;
  phone: string;
  overdueCredits: number;
  totalDue: number;
  avgDelayDays: number;
  lastAction: string;
  credits: any[];
}