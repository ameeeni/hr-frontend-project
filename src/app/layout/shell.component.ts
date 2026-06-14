import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { KeycloakService } from '../core/auth/keycloak.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles: string[];
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatToolbarModule, MatListModule,
    MatIconModule, MatButtonModule, MatTooltipModule
  ],
  template: `
    <mat-sidenav-container class="shell-container">
      <mat-sidenav mode="side" opened class="sidenav">
        <div class="logo-area">
          <mat-icon class="logo-icon">business</mat-icon>
          <span class="logo-text">HR Manager</span>
        </div>
        <mat-nav-list>
          @for (item of visibleNavItems(); track item.route) {
            <a mat-list-item [routerLink]="item.route" routerLinkActive="active-link">
              <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
              <span matListItemTitle>{{ item.label }}</span>
            </a>
          }
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar color="primary" class="toolbar">
          <span class="toolbar-title">{{ pageTitle() }}</span>
          <span class="spacer"></span>
          <span class="user-name">{{ userName() }}</span>
          <span class="role-badge">{{ roleLabel() }}</span>
          <button mat-icon-button (click)="logout()" matTooltip="Déconnexion">
            <mat-icon>logout</mat-icon>
          </button>
        </mat-toolbar>
        <div class="content">
          <router-outlet />
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .shell-container { height: 100vh; }
    .sidenav { width: 240px; background: #1a237e; color: white; }
    .logo-area { display: flex; align-items: center; gap: 10px; padding: 20px 16px; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .logo-icon { font-size: 32px; width: 32px; height: 32px; color: #90caf9; }
    .logo-text { font-size: 20px; font-weight: 700; color: white; }
    mat-nav-list a { color: rgba(255,255,255,0.8); border-radius: 8px; margin: 4px 8px; }
    mat-nav-list a:hover { background: rgba(255,255,255,0.1); color: white; }
    mat-nav-list a.active-link { background: rgba(255,255,255,0.15) !important; color: white !important; }
    .toolbar { position: sticky; top: 0; z-index: 100; }
    .toolbar-title { font-size: 18px; font-weight: 500; }
    .spacer { flex: 1; }
    .user-name { margin-right: 8px; font-size: 14px; }
    .role-badge { margin-right: 16px; font-size: 11px; font-weight: 700; background: rgba(255,255,255,0.2); padding: 2px 10px; border-radius: 12px; letter-spacing: 0.5px; text-transform: uppercase; }
    .content { padding: 24px; }
  `]
})
export class ShellComponent {
  private keycloak = inject(KeycloakService);

  userName = computed(() => {
    const info = this.keycloak.userInfo();
    return info?.username ?? '';
  });

  roleLabel = computed(() => {
    const info = this.keycloak.userInfo();
    if (!info?.roles) return '';
    const roles = info.roles.map(r => r.replace('ROLE_', '').toUpperCase());
    if (roles.includes('HR') || roles.includes('RH')) return 'RH';
    if (roles.includes('MANAGER')) return 'Manager';
    if (roles.includes('EMPLOYEE')) return 'Employé';
    return roles[0] ?? '';
  });

  pageTitle = signal('Tableau de bord');

  private navItems: NavItem[] = [
    { label: 'Tableau de bord', icon: 'dashboard', route: '/app/dashboard', roles: ['RH', 'MANAGER', 'EMPLOYEE'] },
    { label: 'Employés', icon: 'people', route: '/app/employees', roles: ['RH', 'MANAGER'] },
    { label: 'Équipes', icon: 'groups', route: '/app/teams', roles: ['RH', 'MANAGER'] },
    { label: 'Congés', icon: 'event_note', route: '/app/leaves', roles: ['RH', 'MANAGER', 'EMPLOYEE'] },
    { label: 'Paie', icon: 'payments', route: '/app/payroll', roles: ['RH'] },
  ];

  visibleNavItems = computed(() => {
    const info = this.keycloak.userInfo();
    const roles = info?.roles ?? [];
    const normalize = (r: string) => r.replace('ROLE_', '').toUpperCase();
    return this.navItems.filter(item =>
      item.roles.length === 0 ||
      item.roles.some(requiredRole => {
        const normalizedRequired = requiredRole.toUpperCase();
        return roles.some(userRole => {
          const normalizedUser = normalize(userRole);
          // Support both HR and RH
          if ((normalizedRequired === 'HR' || normalizedRequired === 'RH') &&
              (normalizedUser === 'HR' || normalizedUser === 'RH')) {
            return true;
          }
          return normalizedUser === normalizedRequired;
        });
      })
    );
  });

  logout(): void {
    this.keycloak.logout();
  }
}
