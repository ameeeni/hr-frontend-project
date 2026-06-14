import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { TeamService } from '../../core/services/team.service';
import { EmployeeService } from '../../core/services/employee.service';
import { Team, TeamMember } from '../../core/models/team.model';
import { Employee } from '../../core/models/employee.model';
import { KeycloakService } from '../../core/auth/keycloak.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';

@Component({
  selector: 'app-team-members',
  standalone: true,
  imports: [
    MatTableModule, MatButtonModule, MatIconModule, MatCardModule,
    MatChipsModule, MatTooltipModule, MatProgressSpinnerModule,
    MatDialogModule, MatSnackBarModule, MatSelectModule,
    MatFormFieldModule, FormsModule, RouterLink
  ],
  template: `
    <div class="page-header">
      <div class="header-content">
        <button mat-icon-button routerLink="/app/teams" class="back-button">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="title-section">
          <h1 class="page-title">👥 {{ team()?.nom || 'Équipe' }}</h1>
          <p class="subtitle">{{ team()?.description || 'Gestion des membres de l&apos;équipe' }}</p>
        </div>
      </div>
      <div class="header-stats">
        <mat-chip color="primary" highlighted>
          <mat-icon>people</mat-icon>
          {{ members().length }} membre(s)
        </mat-chip>
      </div>
    </div>

    @if (loading()) {
      <div class="spinner-center">
        <mat-spinner diameter="60" />
        <p class="loading-text">Chargement des membres...</p>
      </div>
    } @else {
      <!-- Section : Ajouter un membre (RH uniquement) -->
      @if (isHR()) {
        <mat-card class="add-member-card elevated-card">
          <mat-card-header class="card-header-colored">
            <mat-icon class="header-icon">person_add</mat-icon>
            <mat-card-title>Ajouter un membre à l'équipe</mat-card-title>
          </mat-card-header>
          <mat-card-content class="add-member-content">
            <div class="add-member-form">
              <mat-form-field appearance="outline" class="employee-select">
                <mat-label>
                  <mat-icon class="field-icon">search</mat-icon>
                  Sélectionner un employé
                </mat-label>
                <mat-select [(ngModel)]="selectedEmployeeId">
                  <mat-option value="">-- Choisir un employé --</mat-option>
                  @for (emp of availableEmployees(); track emp.id) {
                    <mat-option [value]="emp.id">
                      <div class="employee-option">
                        <mat-icon class="option-icon">person</mat-icon>
                        <span class="employee-name">{{ emp.nom }}</span>
                        <span class="employee-details">{{ emp.poste }}</span>
                        <mat-chip class="role-chip" [color]="getRoleColor(emp.role)" highlighted>
                          {{ getRoleLabel(emp.role) }}
                        </mat-chip>
                      </div>
                    </mat-option>
                  }
                </mat-select>
                <mat-hint>Sélectionnez un employé qui n&apos;est pas encore dans l&apos;équipe</mat-hint>
              </mat-form-field>
              <button
                mat-raised-button
                color="primary"
                class="add-button"
                (click)="addMember()"
                [disabled]="!selectedEmployeeId || adding()">
                @if (adding()) {
                  <mat-icon>hourglass_empty</mat-icon>
                  <span>Ajout en cours...</span>
                } @else {
                  <mat-icon>person_add</mat-icon>
                  <span>Ajouter à l&apos;équipe</span>
                }
              </button>
            </div>
            @if (availableEmployees().length === 0) {
              <div class="info-message">
                <mat-icon>info</mat-icon>
                <span>Tous les employés disponibles sont déjà dans cette équipe ou sont des RH.</span>
              </div>
            }
          </mat-card-content>
        </mat-card>
      }

      <!-- Section : Liste des membres -->
      <mat-card class="members-card elevated-card">
        <mat-card-header class="card-header-colored">
          <mat-icon class="header-icon">group</mat-icon>
          <mat-card-title>Membres de l&apos;équipe ({{ members().length }})</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          @if (members().length === 0) {
            <div class="empty-state">
              <mat-icon>group_off</mat-icon>
              <h3>Aucun membre</h3>
              <p>Cette équipe ne contient aucun membre pour le moment.</p>
              @if (isHR()) {
                <p class="hint">Utilisez le formulaire ci-dessus pour ajouter des membres.</p>
              }
            </div>
          } @else {
            <div class="table-container">
              <table mat-table [dataSource]="members()" class="full-table modern-table">
                <ng-container matColumnDef="nom">
                  <th mat-header-cell *matHeaderCellDef>
                    <mat-icon class="header-icon-small">badge</mat-icon>
                    Nom
                  </th>
                  <td mat-cell *matCellDef="let m">
                    <div class="member-name">
                      <mat-icon class="member-icon">person</mat-icon>
                      <strong>{{ m.nom }}</strong>
                    </div>
                  </td>
                </ng-container>
                <ng-container matColumnDef="email">
                  <th mat-header-cell *matHeaderCellDef>
                    <mat-icon class="header-icon-small">email</mat-icon>
                    Email
                  </th>
                  <td mat-cell *matCellDef="let m">
                    <a [href]="'mailto:' + m.email" class="email-link">{{ m.email }}</a>
                  </td>
                </ng-container>
                <ng-container matColumnDef="poste">
                  <th mat-header-cell *matHeaderCellDef>
                    <mat-icon class="header-icon-small">work</mat-icon>
                    Poste
                  </th>
                  <td mat-cell *matCellDef="let m">{{ m.poste }}</td>
                </ng-container>
                <ng-container matColumnDef="role">
                  <th mat-header-cell *matHeaderCellDef>
                    <mat-icon class="header-icon-small">assignment_ind</mat-icon>
                    Rôle
                  </th>
                  <td mat-cell *matCellDef="let m">
                    <mat-chip [color]="getRoleColor(m.role)" highlighted>
                      {{ getRoleLabel(m.role) }}
                    </mat-chip>
                  </td>
                </ng-container>
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let m">
                    @if (isHR()) {
                      <button
                        mat-mini-fab
                        color="warn"
                        (click)="removeMember(m)"
                        matTooltip="Retirer {{ m.nom }} de l&apos;équipe"
                        class="remove-button">
                        <mat-icon>person_remove</mat-icon>
                      </button>
                    } @else {
                      <span class="no-action">-</span>
                    }
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="member-row"></tr>
              </table>
            </div>
          }
        </mat-card-content>
      </mat-card>
    }
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
      align-items: center;
      gap: 16px;
    }
    .back-button {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }
    .back-button:hover {
      background: rgba(255, 255, 255, 0.3);
    }
    .title-section {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .page-title {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .subtitle {
      margin: 0;
      font-size: 14px;
      opacity: 0.9;
    }
    .header-stats mat-chip {
      background: rgba(255, 255, 255, 0.2) !important;
      color: white !important;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .spinner-center {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 400px;
      gap: 20px;
    }
    .loading-text {
      font-size: 16px;
      color: #666;
    }
    .elevated-card {
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 24px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .elevated-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
    }
    .card-header-colored {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px 24px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .card-header-colored mat-card-title {
      color: white;
      font-size: 20px;
      font-weight: 600;
      margin: 0;
    }
    .header-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }
    .add-member-content {
      padding: 24px !important;
    }
    .add-member-form {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      flex-wrap: wrap;
    }
    .employee-select {
      flex: 1;
      min-width: 350px;
    }
    .field-icon {
      vertical-align: middle;
      margin-right: 8px;
      font-size: 20px;
    }
    .employee-option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
    }
    .option-icon {
      color: #667eea;
      font-size: 20px;
    }
    .employee-name {
      font-weight: 600;
      flex: 1;
    }
    .employee-details {
      color: #666;
      font-size: 13px;
    }
    .role-chip {
      font-size: 11px;
      height: 24px;
    }
    .add-button {
      height: 56px;
      padding: 0 32px;
      font-size: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .info-message {
      margin-top: 16px;
      padding: 16px;
      background: #e3f2fd;
      border-left: 4px solid #2196f3;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 12px;
      color: #1565c0;
    }
    .info-message mat-icon {
      color: #2196f3;
    }
    .table-container {
      overflow-x: auto;
    }
    .full-table {
      width: 100%;
    }
    .modern-table {
      border-collapse: separate;
      border-spacing: 0;
    }
    .modern-table th {
      background: #f5f7fa;
      font-weight: 600;
      color: #1a237e;
      padding: 16px;
      text-align: left;
      border-bottom: 2px solid #667eea;
    }
    .modern-table td {
      padding: 16px;
      border-bottom: 1px solid #e0e0e0;
    }
    .header-icon-small {
      vertical-align: middle;
      margin-right: 8px;
      font-size: 18px;
      color: #667eea;
    }
    .member-row {
      transition: background-color 0.2s;
    }
    .member-row:hover {
      background-color: #f8f9fa;
    }
    .member-name {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .member-icon {
      color: #667eea;
      font-size: 20px;
    }
    .email-link {
      color: #667eea;
      text-decoration: none;
      transition: color 0.2s;
    }
    .email-link:hover {
      color: #764ba2;
      text-decoration: underline;
    }
    .remove-button {
      transform: scale(0.8);
    }
    .no-action {
      color: #999;
      font-style: italic;
    }
    .empty-state {
      text-align: center;
      padding: 80px 20px;
      color: #999;
    }
    .empty-state mat-icon {
      font-size: 80px;
      width: 80px;
      height: 80px;
      margin-bottom: 16px;
      color: #ddd;
    }
    .empty-state h3 {
      font-size: 24px;
      font-weight: 600;
      color: #666;
      margin: 16px 0 8px;
    }
    .empty-state p {
      font-size: 16px;
      margin: 8px 0;
    }
    .empty-state .hint {
      color: #667eea;
      font-weight: 500;
    }
    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }
      .add-member-form {
        flex-direction: column;
      }
      .employee-select {
        width: 100%;
      }
      .add-button {
        width: 100%;
      }
    }
  `]
})
export class TeamMembersComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private teamService = inject(TeamService);
  private employeeService = inject(EmployeeService);
  private keycloak = inject(KeycloakService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  displayedColumns = ['nom', 'email', 'poste', 'role', 'actions'];

  team = signal<Team | null>(null);
  members = signal<TeamMember[]>([]);
  allEmployees = signal<Employee[]>([]);
  loading = signal(true);
  adding = signal(false);

  selectedEmployeeId: number | string = '';
  teamId: number = 0;

  isHR = computed(() => this.keycloak.hasRole('HR') || this.keycloak.hasRole('RH'));

  // Employés disponibles = tous les employés SAUF ceux déjà dans l'équipe ET SAUF les RH
  availableEmployees = computed(() => {
    const memberIds = this.members().map(m => m.id);
    return this.allEmployees().filter(emp =>
      !memberIds.includes(emp.id!) &&
      emp.role !== 'HR' &&
      emp.role !== 'RH'
    );
  });

  ngOnInit(): void {
    this.teamId = +this.route.snapshot.paramMap.get('id')!;
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);

    // Charger l'équipe et ses membres
    this.teamService.getById(this.teamId).subscribe({
      next: (team) => {
        this.team.set(team);
        this.loadMembers();
      },
      error: (err) => {
        console.error('Erreur chargement équipe:', err);
        this.snackBar.open('Erreur lors du chargement de l\'équipe', 'OK', { duration: 3000 });
        this.loading.set(false);
      }
    });

    // Charger tous les employés pour le select
    if (this.isHR()) {
      this.employeeService.getAll().subscribe({
        next: (employees) => {
          this.allEmployees.set(employees);
        },
        error: (err) => {
          console.error('Erreur chargement employés:', err);
        }
      });
    }
  }

  loadMembers(): void {
    this.teamService.getMembers(this.teamId).subscribe({
      next: (members) => {
        this.members.set(members);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erreur chargement membres:', err);
        this.snackBar.open('Erreur lors du chargement des membres', 'OK', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  addMember(): void {
    if (!this.selectedEmployeeId) return;

    this.adding.set(true);
    const userId = +this.selectedEmployeeId;

    this.teamService.addMember(this.teamId, userId).subscribe({
      next: () => {
        this.snackBar.open('Membre ajouté avec succès', 'OK', { duration: 3000 });
        this.selectedEmployeeId = '';
        this.adding.set(false);
        this.loadMembers();
      },
      error: (err) => {
        console.error('Erreur ajout membre:', err);
        const message = err?.error?.message || 'Erreur lors de l\'ajout du membre';
        this.snackBar.open(message, 'OK', { duration: 4000 });
        this.adding.set(false);
      }
    });
  }

  removeMember(member: TeamMember): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        message: `Retirer ${member.nom} de cette équipe ?`,
        confirmLabel: 'Retirer'
      }
    });

    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.teamService.removeMember(this.teamId, member.id).subscribe({
          next: () => {
            this.snackBar.open('Membre retiré avec succès', 'OK', { duration: 3000 });
            this.loadMembers();
          },
          error: (err) => {
            console.error('Erreur retrait membre:', err);
            const message = err?.error?.message || 'Erreur lors du retrait du membre';
            this.snackBar.open(message, 'OK', { duration: 4000 });
          }
        });
      }
    });
  }

  getRoleColor(role: string): string {
    switch (role) {
      case 'HR':
      case 'RH': return 'accent';
      case 'MANAGER': return 'primary';
      case 'EMPLOYEE': return 'warn';
      default: return '';
    }
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case 'HR':
      case 'RH': return 'RH';
      case 'MANAGER': return 'Manager';
      case 'EMPLOYEE': return 'Employé';
      default: return role;
    }
  }
}
