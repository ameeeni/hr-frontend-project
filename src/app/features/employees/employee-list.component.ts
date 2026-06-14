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
import { EmployeeService } from '../../core/services/employee.service';
import { Employee } from '../../core/models/employee.model';
import { KeycloakService } from '../../core/auth/keycloak.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [
    MatTableModule, MatButtonModule, MatIconModule, MatCardModule,
    MatChipsModule, MatTooltipModule, MatInputModule, MatFormFieldModule,
    MatProgressSpinnerModule, MatDialogModule, MatSnackBarModule,
    FormsModule, RouterLink
  ],
  template: `
    <div class="page-header">
      <h1 class="page-title">Gestion des Employés</h1>
      @if (isHR()) {
        <button mat-raised-button color="primary" routerLink="new">
          <mat-icon>add</mat-icon> Nouvel Employé
        </button>
      }
    </div>

    <mat-card>
      <mat-card-content>
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Rechercher un employé</mat-label>
          <input matInput [(ngModel)]="searchQuery" (ngModelChange)="filterEmployees()" placeholder="Nom, email, poste...">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>

        @if (loading()) {
          <div class="spinner-center"><mat-spinner diameter="40" /></div>
        } @else {
          <table mat-table [dataSource]="filteredEmployees()" class="full-table">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Nom</th>
              <td mat-cell *matCellDef="let e">{{ e.firstName }} {{ e.lastName }}</td>
            </ng-container>
            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>Email</th>
              <td mat-cell *matCellDef="let e">{{ e.email }}</td>
            </ng-container>
            <ng-container matColumnDef="position">
              <th mat-header-cell *matHeaderCellDef>Poste</th>
              <td mat-cell *matCellDef="let e">{{ e.position }}</td>
            </ng-container>
            <ng-container matColumnDef="department">
              <th mat-header-cell *matHeaderCellDef>Département</th>
              <td mat-cell *matCellDef="let e">{{ e.departmentName }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Statut</th>
              <td mat-cell *matCellDef="let e">
                <mat-chip [color]="e.status === 'ACTIVE' ? 'primary' : 'warn'" highlighted>
                  {{ e.status === 'ACTIVE' ? 'Actif' : 'Inactif' }}
                </mat-chip>
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let e">
                @if (isHR()) {
                  <button mat-icon-button [routerLink]="[e.id, 'edit']" matTooltip="Modifier" color="primary">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button (click)="deleteEmployee(e)" matTooltip="Supprimer" color="warn">
                    <mat-icon>delete</mat-icon>
                  </button>
                }
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          @if (filteredEmployees().length === 0) {
            <div class="empty-state">
              <mat-icon>people_outline</mat-icon>
              <p>Aucun employé trouvé</p>
            </div>
          }
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-title { margin: 0; font-size: 24px; font-weight: 600; }
    .search-field { width: 100%; margin-bottom: 16px; }
    .full-table { width: 100%; }
    .spinner-center { display: flex; justify-content: center; padding: 40px; }
    .empty-state { text-align: center; padding: 40px; color: #999; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
  `]
})
export class EmployeeListComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private keycloak = inject(KeycloakService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  displayedColumns = ['name', 'email', 'position', 'department', 'status', 'actions'];
  employees = signal<Employee[]>([]);
  filteredEmployees = signal<Employee[]>([]);
  loading = signal(true);
  searchQuery = '';
  isHR = computed(() => this.keycloak.hasRole('HR') || this.keycloak.hasRole('RH'));

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.loading.set(true);
    this.employeeService.getAll().subscribe({
      next: data => {
        this.employees.set(data);
        this.filteredEmployees.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  filterEmployees(): void {
    const q = this.searchQuery.toLowerCase();
    this.filteredEmployees.set(
      this.employees().filter(e =>
        `${e.nom} ${e.email} ${e.poste} ${e.departement}`.toLowerCase().includes(q)
      )
    );
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

  deleteEmployee(employee: Employee): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { message: `Supprimer ${employee.nom} ?` }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed && employee.id) {
        this.employeeService.delete(employee.id).subscribe({
          next: () => {
            this.snackBar.open('Employé supprimé', 'OK', { duration: 3000 });
            this.loadEmployees();
          },
          error: () => this.snackBar.open('Erreur lors de la suppression', 'OK', { duration: 3000 })
        });
      }
    });
  }
}
