import {Routes} from '@angular/router';
import {roleGuard} from '../../core/auth/role.guard';

export const chatRoutes: Routes = [

  {
    path: '',
    loadComponent: () => import('./chat-component').then(m => m.ChatComponent),
    canActivate: [roleGuard],
    data: { roles: ['HR', 'RH', 'MANAGER', 'EMPLOYEE'] }
  }
];
