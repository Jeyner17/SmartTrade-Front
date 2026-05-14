export interface DebtForgiveness {
  creditId: number;
  amountForgiven: number;
  reason: string;
  authorizedBy?: number;
  metadata?: {
    justification?: string;
    supervisorPassword?: string;
    observations?: string;
  };
}