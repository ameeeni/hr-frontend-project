import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/auth.guard';

export const teamsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./team-list.component').then(m => m.TeamListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'new',
    loadComponent: () => import('./team-form.component').then(m => m.TeamFormComponent),
    canActivate: [authGuard]
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./team-form.component').then(m => m.TeamFormComponent),
    canActivate: [authGuard]
  },
  {
    path: ':id/members',
    loadComponent: () => import('./team-members.component').then(m => m.TeamMembersComponent),
    canActivate: [authGuard]
  }
];


