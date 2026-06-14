export interface Team {
  id?: number;
  nom: string;
  description?: string;
  membres?: TeamMember[];
  nombreMembres?: number;
}

export interface TeamMember {
  id: number;
  nom: string;
  email: string;
  poste: string;
  role: string;
}
