import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/role.guard';

export const leavesRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./leave-list.component').then(m => m.LeaveListComponent),
    canActivate: [roleGuard],
    data: { roles: ['HR', 'RH', 'MANAGER', 'EMPLOYEE'] }
  },
  {
    path: 'new',
    loadComponent: () => import('./leave-request.component').then(m => m.LeaveRequestComponent),
    canActivate: [roleGuard],
    data: { roles: ['HR', 'RH', 'MANAGER', 'EMPLOYEE'] }
  }
];
