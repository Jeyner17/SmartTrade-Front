export interface CollectionAction {
  customerId: number;
  creditId?: number;
  actionType: 'llamada' | 'sms' | 'email' | 'visita' | 'otro';
  description: string;
  status: 'éxito' | 'sin_respuesta' | 'compromiso' | 'rechazado';
  compromiseDate?: string;
  compromiseAmount?: number;
  notes?: string;
  recordedAt?: string;
}
