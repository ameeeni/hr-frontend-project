import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TeamService } from '../../core/services/team.service';
import { Team } from '../../core/models/team.model';
import { KeycloakService } from '../../core/auth/keycloak.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';

@Component({
  selector: 'app-team-list',
  standalone: true,
  imports: [
    MatTableModule, MatButtonModule, MatIconModule, MatCardModule,
    MatChipsModule, MatTooltipModule, MatInputModule, MatFormFieldModule,
    MatProgressSpinnerModule, MatDialogModule, MatSnackBarModule,
    FormsModule, RouterLink
  ],
  template: `
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">👥 Gestion des Équipes</h1>
        <p class="subtitle">Gérez les équipes et leurs membres</p>
      </div>
      @if (isHR()) {
        <button mat-raised-button color="primary" routerLink="new" class="large-button">
          <mat-icon>add</mat-icon> Créer une Équipe
        </button>
      }
    </div>

    <mat-card class="teams-card">
      <mat-card-content>
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Rechercher une équipe</mat-label>
          <input matInput [(ngModel)]="searchQuery" (ngModelChange)="filterTeams()" placeholder="Nom, description...">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>

        @if (loading()) {
          <div class="spinner-center">
            <mat-spinner diameter="60" />
            <p class="loading-text">Chargement des équipes...</p>
          </div>
        } @else {
          @if (filteredTeams().length === 0) {
            <div class="empty-state">
              <mat-icon>groups</mat-icon>
              <h3>Aucune équipe trouvée</h3>
              <p>Commencez par créer votre première équipe</p>
              @if (isHR()) {
                <button mat-raised-button color="primary" routerLink="new" class="create-first-button">
                  <mat-icon>add</mat-icon> Créer une Équipe
                </button>
              }
            </div>
          } @else {
            <div class="teams-grid">
              @for (team of filteredTeams(); track team.id) {
                <mat-card class="team-card">
                  <mat-card-header>
                    <div class="team-header">
                      <mat-icon class="team-icon">groups</mat-icon>
                      <div class="team-title-section">
                        <mat-card-title class="team-name">{{ team.nom }}</mat-card-title>
                        <mat-card-subtitle>{{ team.description || 'Aucune description' }}</mat-card-subtitle>
                      </div>
                    </div>
                  </mat-card-header>

                  <mat-card-content class="team-content">
                    <div class="team-stats">
                      <mat-chip color="primary" highlighted class="members-chip">
                        <mat-icon>people</mat-icon>
                        <span>{{ team.membres?.length || 0 }} membre(s)</span>
                      </mat-chip>
                    </div>
                  </mat-card-content>

                  <mat-card-actions class="team-actions">
                    <button
                      mat-raised-button
                      color="primary"
                      [routerLink]="[team.id, 'members']"
                      class="action-button members-button">
                      <mat-icon>group</mat-icon>
                      Voir les Membres
                    </button>

                    @if (isHR()) {
                      <button
                        mat-button
                        [routerLink]="[team.id, 'edit']"
                        class="action-button edit-button">
                        <mat-icon>edit</mat-icon>
                        Modifier
                      </button>

                      <button
                        mat-button
                        color="warn"
                        (click)="deleteTeam(team)"
                        class="action-button delete-button">
                        <mat-icon>delete</mat-icon>
                        Supprimer
                      </button>
                    }
                  </mat-card-actions>
                </mat-card>
              }
            </div>
          }
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      padding: 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      color: white;
      box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
    }
    .header-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .page-title {
      margin: 0;
      font-size: 32px;
      font-weight: 700;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .subtitle {
      margin: 0;
      font-size: 16px;
      opacity: 0.9;
    }
    .large-button {
      height: 48px;
      padding: 0 32px;
      font-size: 16px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
    .teams-card {
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      border-radius: 12px;
    }
    .search-field {
      width: 100%;
      margin-bottom: 24px;
    }
    .spinner-center {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 80px 20px;
      gap: 20px;
    }
    .loading-text {
      font-size: 16px;
      color: #666;
    }
    .empty-state {
      text-align: center;
      padding: 100px 20px;
      color: #999;
    }
    .empty-state mat-icon {
      font-size: 100px;
      width: 100px;
      height: 100px;
      margin-bottom: 24px;
      color: #ddd;
    }
    .empty-state h3 {
      font-size: 28px;
      font-weight: 600;
      color: #666;
      margin: 16px 0 8px;
    }
    .empty-state p {
      font-size: 16px;
      margin: 8px 0 24px;
    }
    .create-first-button {
      margin-top: 16px;
      height: 48px;
      padding: 0 32px;
      font-size: 16px;
    }
    .teams-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 24px;
      margin-top: 24px;
    }
    .team-card {
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;
      border: 2px solid transparent;
      overflow: hidden;
    }
    .team-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(102, 126, 234, 0.2);
      border-color: #667eea;
    }
    .team-header {
      display: flex;
      align-items: center;
      gap: 16px;
      width: 100%;
    }
    .team-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #667eea;
    }
    .team-title-section {
      flex: 1;
    }
    .team-name {
      font-size: 22px;
      font-weight: 700;
      color: #1a237e;
      margin: 0 0 4px 0;
    }
    .team-content {
      padding: 16px 24px;
    }
    .team-stats {
      display: flex;
      gap: 12px;
      align-items: center;
    }
    .members-chip {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      padding: 8px 16px;
      height: auto;
    }
    .members-chip mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .team-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 16px;
      background: #f8f9fa;
      border-top: 1px solid #e0e0e0;
    }
    .action-button {
      width: 100%;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-weight: 600;
      font-size: 15px;
      border-radius: 8px;
    }
    .members-button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
    }
    .members-button:hover {
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.5);
    }
    .edit-button {
      color: #667eea;
      border: 2px solid #667eea;
    }
    .edit-button:hover {
      background: rgba(102, 126, 234, 0.1);
    }
    .delete-button {
      color: #f44336;
      border: 2px solid #f44336;
    }
    .delete-button:hover {
      background: rgba(244, 67, 54, 0.1);
    }
    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }
      .teams-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class TeamListComponent implements OnInit {
  private teamService = inject(TeamService);
  private keycloak = inject(KeycloakService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  teams = signal<Team[]>([]);
  filteredTeams = signal<Team[]>([]);
  loading = signal(true);
  searchQuery = '';
  isHR = computed(() => this.keycloak.hasRole('HR') || this.keycloak.hasRole('RH'));

  ngOnInit(): void {
    this.loadTeams();
  }

  loadTeams(): void {
    this.loading.set(true);
    this.teamService.getAll().subscribe({
      next: data => {
        this.teams.set(data);
        this.filteredTeams.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des équipes:', err);
        this.loading.set(false);
      }
    });
  }

  filterTeams(): void {
    const q = this.searchQuery.toLowerCase();
    this.filteredTeams.set(
      this.teams().filter(t =>
        `${t.nom} ${t.description}`.toLowerCase().includes(q)
      )
    );
  }

  deleteTeam(team: Team): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { message: `Supprimer l'équipe ${team.nom} ? Tous les membres seront retirés de cette équipe.` }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed && team.id) {
        this.teamService.delete(team.id).subscribe({
          next: () => {
            this.snackBar.open('Équipe supprimée', 'OK', { duration: 3000 });
            this.loadTeams();
          },
          error: () => this.snackBar.open('Erreur lors de la suppression', 'OK', { duration: 3000 })
        });
      }
    });
  }
}
