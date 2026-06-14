export interface Payroll {
  id?: number;
  employeeId: number;
  employeeName?: string;
  month: number;
  year: number;
  baseSalary: number;
  bonuses: number;
  deductions: number;
  netSalary: number;
  status: 'DRAFT' | 'PROCESSED' | 'PAID';
  processedAt?: string;
}
