import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { LeaveService } from '../../core/services/leave.service';
import { EmployeeService } from '../../core/services/employee.service';

@Component({
  selector: 'app-leave-request',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatInputModule, MatFormFieldModule,
    MatButtonModule, MatIconModule, MatCardModule, MatSelectModule,
    MatSnackBarModule, RouterLink
  ],
  template: `
    <div class="page-header">
      <h1 class="page-title">Nouvelle demande de congé</h1>
      <button mat-button routerLink="/app/leaves"><mat-icon>arrow_back</mat-icon> Retour</button>
    </div>
    <mat-card class="form-card">
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="submit()" class="form-grid">
          <mat-form-field appearance="outline">
            <mat-label>Type de congé</mat-label>
            <mat-select formControlName="type">
              <mat-option value="CONGE_ANNUEL">Congé annuel</mat-option>
              <mat-option value="MALADIE">Congé maladie</mat-option>
              <mat-option value="TELETRAVAIL">Télétravail</mat-option>
            </mat-select>
          </mat-form-field>

          <div></div>

          <mat-form-field appearance="outline">
            <mat-label>Date de début</mat-label>
            <input matInput formControlName="startDate" type="date">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Date de fin</mat-label>
            <input matInput formControlName="endDate" type="date">
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Motif</mat-label>
            <textarea matInput formControlName="reason" rows="4"></textarea>
          </mat-form-field>

          <div class="form-actions">
            <button mat-button type="button" routerLink="/app/leaves">Annuler</button>
            <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || saving()">
              <mat-icon>send</mat-icon>
              {{ saving() ? 'Envoi...' : 'Soumettre' }}
            </button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-title { margin: 0; font-size: 24px; font-weight: 600; }
    .form-card { max-width: 700px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .full-width { grid-column: 1 / -1; }
    .form-actions { grid-column: 1 / -1; display: flex; justify-content: flex-end; gap: 12px; }
  `]
})
export class LeaveRequestComponent {
  private fb = inject(FormBuilder);
  private leaveService = inject(LeaveService);
  private employeeService = inject(EmployeeService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  saving = signal(false);

  form = this.fb.group({
    // default to backend enum name
    type: ['CONGE_ANNUEL', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    reason: ['', Validators.required]
  });

  submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);

    console.log('📤 Récupération de l\'utilisateur connecté...');

    // 1. Récupérer l'utilisateur connecté via getCurrentUser
    this.employeeService.getCurrentUser().subscribe({
      next: (currentUser) => {
        console.log('✅ Utilisateur récupéré:', currentUser);

        if (!currentUser.id) {
          this.snackBar.open('Erreur: ID utilisateur introuvable', 'OK', { duration: 3000 });
          this.saving.set(false);
          return;
        }

        // 2. Préparer le payload
        const formValue = this.form.value as any;
        const payload = {
          dateDebut: formValue.startDate,
          dateFin: formValue.endDate,
          type: formValue.type,
          motif: formValue.reason
        };

        console.log('📤 Envoi de la demande pour employeeId:', currentUser.id);
        console.log('📤 Payload:', payload);

        // 3. Soumettre la demande avec l'endpoint backend existant
        this.leaveService.submitForEmployee(currentUser.id, payload as any).subscribe({
          next: () => {
            console.log('✅ Demande soumise avec succès');
            this.snackBar.open('Demande soumise avec succès', 'OK', { duration: 3000 });
            this.router.navigate(['/app/leaves']);
          },
          error: (err: any) => {
            console.error('❌ Erreur soumission:', err);
            const msg = err?.error?.message ?? 'Erreur lors de la soumission';
            this.snackBar.open(msg, 'OK', { duration: 4000 });
            this.saving.set(false);
          }
        });
      },
      error: (err) => {
        console.error('❌ Erreur récupération utilisateur:', err);
        this.snackBar.open('Impossible de récupérer vos informations. Veuillez vous reconnecter.', 'OK', { duration: 4000 });
        this.saving.set(false);
      }
    });
  }
}

