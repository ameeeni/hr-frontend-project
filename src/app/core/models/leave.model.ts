export interface Leave {
  id?: number;
  employeeId: number;
  employeeName?: string;
  // Accept both legacy frontend values and backend enum values to be tolerant
  type: 'CONGE_ANNUEL' | 'MALADIE' | 'TELETRAVAIL' |
       'SICK' | 'MATERNITY' | 'PATERNITY' | 'UNPAID' | 'OTHER';
  // Frontend-friendly names (will be normalized from backend dateDebut/dateFin)
  startDate: string;
  endDate: string;
  // frontend uses 'reason', backend may use 'motif'
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  approvedBy?: string;
  approvedAt?: string;
  createdAt?: string;
}
