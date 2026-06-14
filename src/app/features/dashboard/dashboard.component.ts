import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DashboardService, DashboardStats } from '../../core/services/dashboard.service';
import { LeaveService } from '../../core/services/leave.service';
import { KeycloakService } from '../../core/auth/keycloak.service';

interface KpiCard {
  title: string;
  value: number | string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="dashboard">
      <h1 class="page-title">Bonjour, {{ userName() }} 👋</h1>
      <p class="subtitle">Voici un aperçu de votre organisation</p>

      @if (loading()) {
        <div class="spinner-container"><mat-spinner /></div>
      } @else if (error()) {
        <div class="error-state">
          <mat-icon>error_outline</mat-icon>
          <p>Impossible de charger les statistiques</p>
        </div>
      } @else {
        <div class="kpi-grid">
          @for (card of kpiCards(); track card.title) {
            <mat-card class="kpi-card" [style.border-left-color]="card.color">
              <mat-card-content>
                <div class="kpi-content">
                  <div>
                    <p class="kpi-title">{{ card.title }}</p>
                    <p class="kpi-value">{{ card.value }}</p>
                  </div>
                  <mat-icon class="kpi-icon" [style.color]="card.color">{{ card.icon }}</mat-icon>
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>

        @if (stats()) {
          <div class="charts-row">
            <mat-card class="info-card">
              <mat-card-header><mat-card-title>Congés en attente</mat-card-title></mat-card-header>
              <mat-card-content>
                <p class="big-number">{{ stats()!.pendingLeaves }}</p>
                <p class="desc">demandes en attente d'approbation</p>
              </mat-card-content>
            </mat-card>
            <mat-card class="info-card">
              <mat-card-header><mat-card-title>Employés actifs</mat-card-title></mat-card-header>
              <mat-card-content>
                <p class="big-number">{{ stats()!.activeEmployees }}</p>
                <p class="desc">sur {{ stats()!.totalEmployees }} employés</p>
              </mat-card-content>
            </mat-card>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .dashboard { max-width: 1200px; }
    .page-title { font-size: 28px; font-weight: 700; margin: 0 0 4px; }
    .subtitle { color: #666; margin: 0 0 32px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; margin-bottom: 24px; }
    .kpi-card { border-left: 4px solid; }
    .kpi-content { display: flex; justify-content: space-between; align-items: center; }
    .kpi-title { font-size: 13px; color: #666; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
    .kpi-value { font-size: 32px; font-weight: 700; margin: 4px 0 0; }
    .kpi-icon { font-size: 40px; width: 40px; height: 40px; opacity: 0.7; }
    .charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .info-card { text-align: center; padding: 16px; }
    .big-number { font-size: 48px; font-weight: 700; color: #1a237e; margin: 16px 0 8px; }
    .desc { color: #666; }
    .spinner-container { display: flex; justify-content: center; margin-top: 100px; }
    .error-state { text-align: center; padding: 60px; color: #999; }
    .error-state mat-icon { font-size: 48px; width: 48px; height: 48px; color: #f44336; }
  `]
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private leaveService = inject(LeaveService);
  private keycloak = inject(KeycloakService);

  loading = signal(true);
  error = signal(false);
  stats = signal<DashboardStats | null>(null);
  userName = computed(() => this.keycloak.userInfo()?.username ?? '');
  kpiCards = signal<KpiCard[]>([]);
  isHRorManager = computed(() => this.keycloak.hasRole('HR') || this.keycloak.hasRole('RH') || this.keycloak.hasRole('MANAGER'));

  ngOnInit(): void {
    if (this.isHRorManager()) {
      this.dashboardService.getStats().subscribe({
        next: (data) => {
          this.stats.set(data);
          this.kpiCards.set([
            { title: 'Total Employés',   value: data.totalEmployees,  icon: 'people',       color: '#1a237e' },
            { title: 'Employés actifs',  value: data.activeEmployees, icon: 'check_circle', color: '#2e7d32' },
            { title: 'Congés en attente',value: data.pendingLeaves,   icon: 'event_note',   color: '#f57c00' },
            { title: 'Congés approuvés', value: data.approvedLeaves,  icon: 'beach_access', color: '#00897b' },
          ]);
          this.loading.set(false);
        },
        error: () => { this.error.set(true); this.loading.set(false); }
      });
    } else {
      // EMPLOYEE → ses propres congés uniquement
      const userId = this.keycloak.getUserId();
      if (userId) {
        this.leaveService.getForEmployee(userId).subscribe({
          next: (leaves: any[]) => {
            const pending  = leaves.filter((l: any) => l.status === 'PENDING').length;
            const approved = leaves.filter((l: any) => l.status === 'APPROVED').length;
            this.kpiCards.set([
              { title: 'Mes congés en attente', value: pending,       icon: 'event_note',  color: '#f57c00' },
              { title: 'Mes congés approuvés',  value: approved,      icon: 'beach_access',color: '#2e7d32' },
              { title: 'Total mes demandes',     value: leaves.length, icon: 'list_alt',    color: '#1a237e' },
            ]);
            this.loading.set(false);
          },
          error: () => { this.error.set(true); this.loading.set(false); }
        });
      } else {
        this.error.set(true);
        this.loading.set(false);
      }
    }
  }
}
