import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { TeamService } from '../../core/services/team.service';
@Component({
  selector: 'app-team-form',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatInputModule, MatFormFieldModule,
    MatButtonModule, MatIconModule, MatCardModule,
    MatSnackBarModule, RouterLink
  ],
  template: `
    <div class="page-header">
      <h1 class="page-title">{{ isEdit() ? 'Modifier' : 'Nouvelle' }} Équipe</h1>
      <button mat-button routerLink="/app/teams"><mat-icon>arrow_back</mat-icon> Retour</button>
    </div>
    <mat-card>
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="save()" class="form-grid">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nom de l'équipe</mat-label>
            <input matInput formControlName="nom">
            @if (form.get('nom')?.invalid && form.get('nom')?.touched) {
              <mat-error>Nom requis</mat-error>
            }
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Description</mat-label>
            <textarea matInput formControlName="description" rows="4"></textarea>
          </mat-form-field>
          <div class="form-actions">
            <button mat-button type="button" routerLink="/app/teams">Annuler</button>
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
    .form-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
    .full-width { width: 100%; }
    .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; }
  `]
})
export class TeamFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private teamService = inject(TeamService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  isEdit = signal(false);
  saving = signal(false);
  private teamId: number | null = null;
  form = this.fb.group({
    nom: ['', Validators.required],
    description: ['']
  });
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit.set(true);
      this.teamId = +id;
      this.teamService.getById(this.teamId).subscribe(t => this.form.patchValue(t as any));
    }
  }
  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const value = this.form.value as any;
    const obs = this.isEdit()
      ? this.teamService.update(this.teamId!, value)
      : this.teamService.create(value);
    obs.subscribe({
      next: () => {
        this.snackBar.open('Équipe enregistrée avec succès', 'OK', { duration: 3000 });
        this.router.navigate(['/app/teams']);
      },
      error: () => {
        this.snackBar.open('Erreur lors de l\'enregistrement', 'OK', { duration: 3000 });
        this.saving.set(false);
      }
    });
  }
}
