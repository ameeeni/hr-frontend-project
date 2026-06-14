export interface Employee {
  id?: number;
  matricule: string;
  nom: string;
  email: string;
  poste: string;
  departement: string;
  dateEmbauche: string;
  role: 'HR' | 'RH' | 'MANAGER' | 'EMPLOYEE';
  soldeConge?: number;
  teamId?: number;
  teamName?: string;
  managerId?: number;
  managerName?: string;
}
