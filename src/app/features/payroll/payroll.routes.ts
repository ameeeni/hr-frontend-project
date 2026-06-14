import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/role.guard';

export const payrollRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./payroll-list.component').then(m => m.PayrollListComponent),
    canActivate: [roleGuard],
    data: { roles: ['HR', 'RH'] }
  }
];
