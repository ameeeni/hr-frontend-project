import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink } from '@angular/router';
import { LeaveService } from '../../core/services/leave.service';
import { EmployeeService } from '../../core/services/employee.service';
import { Leave } from '../../core/models/leave.model';
import { KeycloakService } from '../../core/auth/keycloak.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-leave-list',
  standalone: true,
  imports: [
    MatTableModule, MatButtonModule, MatIconModule, MatCardModule,
    MatChipsModule, MatTooltipModule, MatDialogModule, MatSnackBarModule,
    MatProgressSpinnerModule, MatTabsModule, RouterLink, DatePipe
  ],
  template: `
    <div class="page-header">
      <h1 class="page-title">Gestion des Congés</h1>
      <button mat-raised-button color="primary" routerLink="new">
        <mat-icon>add</mat-icon> Nouvelle demande
      </button>
    </div>

    <mat-card>
      <mat-card-content>
        <mat-tab-group (selectedIndexChange)="onTabChange($event)">
          <mat-tab label="Tous"></mat-tab>
          <mat-tab label="En attente"></mat-tab>
          <mat-tab label="Approuvés"></mat-tab>
          <mat-tab label="Rejetés"></mat-tab>
        </mat-tab-group>

        @if (loading()) {
          <div class="spinner-center"><mat-spinner diameter="40" /></div>
        } @else {
          <table mat-table [dataSource]="filteredLeaves()" class="full-table">
            <ng-container matColumnDef="employee">
              <th mat-header-cell *matHeaderCellDef>Employé</th>
              <td mat-cell *matCellDef="let l">{{ l.employeeName }}</td>
            </ng-container>
            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef>Type</th>
              <td mat-cell *matCellDef="let l">{{ leaveTypeLabel(l.type) }}</td>
            </ng-container>
            <ng-container matColumnDef="startDate">
              <th mat-header-cell *matHeaderCellDef>Du</th>
              <td mat-cell *matCellDef="let l">{{ l.startDate | date:'dd/MM/yyyy' }}</td>
            </ng-container>
            <ng-container matColumnDef="endDate">
              <th mat-header-cell *matHeaderCellDef>Au</th>
              <td mat-cell *matCellDef="let l">{{ l.endDate | date:'dd/MM/yyyy' }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Statut</th>
              <td mat-cell *matCellDef="let l">
                <mat-chip [color]="statusColor(l.status)" highlighted>{{ statusLabel(l.status) }}</mat-chip>
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let l">
                @if (canApprove() && l.status === 'PENDING') {
                  <button mat-icon-button (click)="approve(l)" matTooltip="Approuver" color="primary">
                    <mat-icon>check_circle</mat-icon>
                  </button>
                  <button mat-icon-button (click)="reject(l)" matTooltip="Rejeter" color="warn">
                    <mat-icon>cancel</mat-icon>
                  </button>
                }
                @if (l.status === 'PENDING') {
                  <button mat-icon-button (click)="delete(l)" matTooltip="Supprimer" color="warn">
                    <mat-icon>delete</mat-icon>
                  </button>
                }
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
          @if (filteredLeaves().length === 0) {
            <div class="empty-state"><mat-icon>event_busy</mat-icon><p>Aucun congé trouvé</p></div>
          }
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-title { margin: 0; font-size: 24px; font-weight: 600; }
    .full-table { width: 100%; margin-top: 16px; }
    .spinner-center { display: flex; justify-content: center; padding: 40px; }
    .empty-state { text-align: center; padding: 40px; color: #999; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
  `]
})
export class LeaveListComponent implements OnInit {
  private leaveService = inject(LeaveService);
  private employeeService = inject(EmployeeService);
  private keycloak = inject(KeycloakService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  displayedColumns = ['employee', 'type', 'startDate', 'endDate', 'status', 'actions'];
  leaves = signal<Leave[]>([]);
  filteredLeaves = signal<Leave[]>([]);
  loading = signal(true);
  canApprove = computed(() => this.keycloak.hasRole('HR') || this.keycloak.hasRole('MANAGER'));
  private activeTab = 0;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);

    // Si l'utilisateur est seulement EMPLOYEE, charger uniquement ses demandes
    if (this.keycloak.hasRole('EMPLOYEE') && !this.keycloak.hasRole('HR') && !this.keycloak.hasRole('MANAGER')) {
      this.employeeService.getCurrentUser().subscribe({
        next: (currentUser) => {
          console.log('✅ Chargement des demandes pour l\'employé:', currentUser);

          if (!currentUser.id) {
            console.error('❌ ID utilisateur introuvable');
            this.loading.set(false);
            return;
          }

          this.leaveService.getForEmployee(currentUser.id).subscribe({
            next: data => {
              this.leaves.set(data);
              this.applyFilter();
              this.loading.set(false);
            },
            error: (err) => {
              console.error('❌ Erreur chargement demandes:', err);
              this.loading.set(false);
            }
          });
        },
        error: (err) => {
          console.error('❌ Erreur récupération utilisateur:', err);
          this.loading.set(false);
        }
      });
      return;
    }

    // Sinon charger toutes les demandes (HR/Manager)
    this.leaveService.getAll().subscribe({
      next: data => {
        this.leaves.set(data);
        this.applyFilter();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('❌ Erreur chargement toutes les demandes:', err);
        this.loading.set(false);
      }
    });
  }

  onTabChange(index: number): void { this.activeTab = index; this.applyFilter(); }

  applyFilter(): void {
    const statuses = [null, 'PENDING', 'APPROVED', 'REJECTED'];
    const s = statuses[this.activeTab];
    this.filteredLeaves.set(s ? this.leaves().filter(l => l.status === s) : this.leaves());
  }

  leaveTypeLabel(type: string): string {
    const map: Record<string, string> = {
      ANNUAL: 'Annuel', SICK: 'Maladie', MATERNITY: 'Maternité',
      PATERNITY: 'Paternité', UNPAID: 'Non payé', OTHER: 'Autre',
      // backend enums
      CONGE_ANNUEL: 'Annuel', MALADIE: 'Maladie', TELETRAVAIL: 'Télétravail',
      MATERNITE: 'Maternité', PATERNITE: 'Paternité', NON_PAYE: 'Non payé', AUTRE: 'Autre'
    };
    return map[type] ?? type;
  }

  statusLabel(s: string): string {
    return { PENDING: 'En attente', APPROVED: 'Approuvé', REJECTED: 'Rejeté', CANCELLED: 'Annulé' }[s] ?? s;
  }

  statusColor(s: string): string {
    return { PENDING: 'accent', APPROVED: 'primary', REJECTED: 'warn', CANCELLED: 'warn' }[s] ?? '';
  }

  approve(leave: Leave): void {
    console.log("logging leave" , leave);
    // Récupérer l'utilisateur connecté via getCurrentUser
    this.employeeService.getCurrentUser().subscribe({
      next: (currentUser) => {
        console.log('✅ Validateur récupéré:', currentUser);

        if (!currentUser.id) {
          this.snackBar.open('Erreur: ID utilisateur introuvable', 'OK', { duration: 3000 });
          return;
        }

        const decision = { decision: 'APPROVED', commentaireValidateur: 'Approuvé' };
        console.log('requestId', leave.id, 'validatorId', currentUser.id, 'decision', decision);

        this.leaveService.validate(leave.id!, currentUser.id, decision).subscribe({
          next: () => {
            this.snackBar.open('Congé approuvé', 'OK', { duration: 3000 });
            this.load();
          },
          error: (err) => {
            console.error('❌ Erreur approbation:', err);
            this.snackBar.open('Erreur lors de l\'approbation', 'OK', { duration: 3000 });
          }
        });
      },
      error: (err) => {
        console.error('❌ Erreur récupération validateur:', err);
        this.snackBar.open('Impossible de récupérer vos informations', 'OK', { duration: 3000 });
      }
    });
  }

  reject(leave: Leave): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { message: 'Rejeter ce congé ?', confirmLabel: 'Rejeter' }
    });

    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        // Récupérer l'utilisateur connecté via getCurrentUser
        this.employeeService.getCurrentUser().subscribe({
          next: (currentUser) => {
            console.log('✅ Validateur récupéré:', currentUser);

            if (!currentUser.id) {
              this.snackBar.open('Erreur: ID utilisateur introuvable', 'OK', { duration: 3000 });
              return;
            }

            const decision = { decision: 'REJECTED', commentaireValidateur: 'Rejeté par le manager' };

            this.leaveService.validate(leave.id!, currentUser.id, decision).subscribe({
              next: () => {
                this.snackBar.open('Congé rejeté', 'OK', { duration: 3000 });
                this.load();
              },
              error: (err) => {
                console.error('❌ Erreur rejet:', err);
                this.snackBar.open('Erreur lors du rejet', 'OK', { duration: 3000 });
              }
            });
          },
          error: (err) => {
            console.error('❌ Erreur récupération validateur:', err);
            this.snackBar.open('Impossible de récupérer vos informations', 'OK', { duration: 3000 });
          }
        });
      }
    });
  }

  delete(leave: Leave): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { message: 'Annuler cette demande ?' }
    });

    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        // Récupérer l'utilisateur connecté via getCurrentUser
        this.employeeService.getCurrentUser().subscribe({
          next: (currentUser) => {
            console.log('✅ Utilisateur récupéré pour annulation:', currentUser);

            if (!currentUser.id) {
              this.snackBar.open('Erreur: ID utilisateur introuvable', 'OK', { duration: 3000 });
              return;
            }

            this.leaveService.cancel(leave.id!, currentUser.id).subscribe({
              next: () => {
                this.snackBar.open('Demande annulée', 'OK', { duration: 3000 });
                this.load();
              },
              error: (err) => {
                console.error('❌ Erreur annulation:', err);
                this.snackBar.open('Erreur lors de l\'annulation', 'OK', { duration: 3000 });
              }
            });
          },
          error: (err) => {
            console.error('❌ Erreur récupération utilisateur:', err);
            this.snackBar.open('Impossible de récupérer vos informations', 'OK', { duration: 3000 });
          }
        });
      }
    });
  }
}
