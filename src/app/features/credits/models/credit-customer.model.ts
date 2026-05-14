export interface CreditReference {
  name: string;
  relationship: 'familiar' | 'laboral' | 'personal';
  phone: string;
}

export interface CreditCustomer {
  id?: number;
  fullName: string;
  documentNumber: string;
  address: string;
  phone: string;
  email: string;
  creditLimit: number;
  references?: CreditReference[] | string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  // Campos adicionales para el formulario
  birthDate?: string;
  secondaryPhone?: string;
  defaultTerm?: number;
  creditRating?: 'A' | 'B' | 'C';
  applyLateInterest?: boolean;
  documents?: {
    idCopy?: File | string | null;
    addressProof?: File | string | null;
    others?: (File | string)[];
  };
}