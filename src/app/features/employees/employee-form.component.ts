import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { EmployeeService } from '../../core/services/employee.service';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatInputModule, MatFormFieldModule,
    MatButtonModule, MatIconModule, MatCardModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule, MatSnackBarModule, RouterLink
  ],
  template: `
    <div class="page-header">
      <h1 class="page-title">{{ isEdit() ? 'Modifier' : 'Nouvel' }} Employé</h1>
      <button mat-button routerLink="/app/employees"><mat-icon>arrow_back</mat-icon> Retour</button>
    </div>

    <mat-card>
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="save()" class="form-grid">
          <mat-form-field appearance="outline">
            <mat-label>Prénom</mat-label>
            <input matInput formControlName="firstName">
            @if (form.get('firstName')?.invalid && form.get('firstName')?.touched) {
              <mat-error>Prénom requis</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Nom</mat-label>
            <input matInput formControlName="lastName">
            @if (form.get('lastName')?.invalid && form.get('lastName')?.touched) {
              <mat-error>Nom requis</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" type="email">
            @if (form.get('email')?.invalid && form.get('email')?.touched) {
              <mat-error>Email invalide</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Téléphone</mat-label>
            <input matInput formControlName="phone">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Poste</mat-label>
            <input matInput formControlName="position">
            @if (form.get('position')?.invalid && form.get('position')?.touched) {
              <mat-error>Poste requis</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Date d'embauche</mat-label>
            <input matInput formControlName="hireDate" type="date">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Salaire de base</mat-label>
            <input matInput formControlName="salary" type="number">
            <span matTextSuffix>MAD</span>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Statut</mat-label>
            <mat-select formControlName="status">
              <mat-option value="ACTIVE">Actif</mat-option>
              <mat-option value="INACTIVE">Inactif</mat-option>
            </mat-select>
          </mat-form-field>

          <div class="form-actions">
            <button mat-button type="button" routerLink="/app/employees">Annuler</button>
            <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || saving()">
              @if (saving()) { <mat-icon>hourglass_empty</mat-icon> } @else { <mat-icon>save</mat-icon> }
              {{ saving() ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-title { margin: 0; font-size: 24px; font-weight: 600; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-actions { grid-column: 1 / -1; display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; }
    @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }
  `]
})
export class EmployeeFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private employeeService = inject(EmployeeService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  isEdit = signal(false);
  saving = signal(false);
  private employeeId: number | null = null;

  form = this.fb.group({
    firstName: ['', Validators.required],
    lastName:  ['', Validators.required],
    email:     ['', [Validators.required, Validators.email]],
    phone:     [''],
    position:  ['', Validators.required],
    hireDate:  ['', Validators.required],
    salary:    [null as number | null],
    status:    ['ACTIVE', Validators.required]
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit.set(true);
      this.employeeId = +id;
      this.employeeService.getById(this.employeeId).subscribe(e => this.form.patchValue(e as any));
    }
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const value = this.form.value as any;
    const obs = this.isEdit()
      ? this.employeeService.update(this.employeeId!, value)
      : this.employeeService.create(value);
    obs.subscribe({
      next: () => {
        this.snackBar.open('Employé enregistré avec succès', 'OK', { duration: 3000 });
        this.router.navigate(['/app/employees']);
      },
      error: () => {
        this.snackBar.open('Erreur lors de l\'enregistrement', 'OK', { duration: 3000 });
        this.saving.set(false);
      }
    });
  }
}
