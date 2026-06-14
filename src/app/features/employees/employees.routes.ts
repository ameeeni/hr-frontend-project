import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/role.guard';

export const employeesRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./employee-list.component').then(m => m.EmployeeListComponent),
    canActivate: [roleGuard],
    data: { roles: ['HR', 'RH', 'MANAGER'] }
  },
  {
    path: 'new',
    loadComponent: () => import('./employee-form.component').then(m => m.EmployeeFormComponent),
    canActivate: [roleGuard],
    data: { roles: ['HR', 'RH'] }
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./employee-form.component').then(m => m.EmployeeFormComponent),
    canActivate: [roleGuard],
    data: { roles: ['HR', 'RH'] }
  }
];
