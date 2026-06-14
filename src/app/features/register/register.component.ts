import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { KeycloakService } from '../../core/auth/keycloak.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  template: `
    <div class="register-container">
      <mat-card class="register-card">
        <mat-card-header>
          <div class="logo-area">
            <mat-icon class="logo-icon">business</mat-icon>
            <h1 class="logo-text">HR Manager</h1>
          </div>
          <p class="subtitle">Créer un nouveau compte</p>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">

            <div class="row-2">
              <mat-form-field appearance="outline">
                <mat-label>Prénom</mat-label>
                <input matInput formControlName="prenom" />
                <mat-icon matPrefix>badge</mat-icon>
                @if (form.get('prenom')?.invalid && form.get('prenom')?.touched) {
                  <mat-error>Prénom requis</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Nom</mat-label>
                <input matInput formControlName="nom" />
                <mat-icon matPrefix>badge</mat-icon>
                @if (form.get('nom')?.invalid && form.get('nom')?.touched) {
                  <mat-error>Nom requis</mat-error>
                }
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Matricule</mat-label>
              <input matInput formControlName="matricule" />
              <mat-icon matPrefix>confirmation_number</mat-icon>
              @if (form.get('matricule')?.invalid && form.get('matricule')?.touched) {
                <mat-error>Matricule requis</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nom d&apos;utilisateur</mat-label>
              <input matInput formControlName="username" autocomplete="username" />
              <mat-icon matPrefix>person</mat-icon>
              @if (form.get('username')?.invalid && form.get('username')?.touched) {
                <mat-error>Nom d&apos;utilisateur requis</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput formControlName="email" type="email" autocomplete="email" />
              <mat-icon matPrefix>email</mat-icon>
              @if (form.get('email')?.invalid && form.get('email')?.touched) {
                <mat-error>Email valide requis</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Mot de passe</mat-label>
              <input matInput [type]="hidePassword() ? 'password' : 'text'"
                formControlName="password" autocomplete="new-password" />
              <mat-icon matPrefix>lock</mat-icon>
              <button mat-icon-button matSuffix type="button"
                (click)="hidePassword.set(!hidePassword())">
                <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (form.get('password')?.invalid && form.get('password')?.touched) {
                <mat-error>Minimum 6 caractères</mat-error>
              }
            </mat-form-field>

            <div class="row-2">
              <mat-form-field appearance="outline">
                <mat-label>Poste</mat-label>
                <input matInput formControlName="poste" />
                <mat-icon matPrefix>work</mat-icon>
                @if (form.get('poste')?.invalid && form.get('poste')?.touched) {
                  <mat-error>Poste requis</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Département</mat-label>
                <input matInput formControlName="departement" />
                <mat-icon matPrefix>business</mat-icon>
                @if (form.get('departement')?.invalid && form.get('departement')?.touched) {
                  <mat-error>Département requis</mat-error>
                }
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Date d&apos;embauche</mat-label>
              <input matInput formControlName="dateEmbauche" type="date" />
              <mat-icon matPrefix>event</mat-icon>
            </mat-form-field>


            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Rôle</mat-label>
              <mat-select formControlName="role">
                <mat-option value="RH">RH (Ressources Humaines)</mat-option>
                <mat-option value="MANAGER">Manager</mat-option>
                <mat-option value="EMPLOYEE">Employé</mat-option>
              </mat-select>
              <mat-icon matPrefix>admin_panel_settings</mat-icon>
              @if (form.get('role')?.invalid && form.get('role')?.touched) {
                <mat-error>Rôle requis</mat-error>
              }
            </mat-form-field>

            @if (errorMessage()) {
              <p class="error-message">{{ errorMessage() }}</p>
            }
            @if (successMessage()) {
              <p class="success-message">{{ successMessage() }}</p>
            }

            <button mat-raised-button color="primary" class="full-width submit-btn"
              type="submit" [disabled]="form.invalid || loading()">
              @if (loading()) {
                <mat-spinner diameter="20" />
              } @else {
                S&apos;inscrire
              }
            </button>

            <div class="login-link">
              Déjà un compte ?
              <a routerLink="/login">Se connecter</a>
            </div>

          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .register-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1a237e 0%, #283593 100%);
      padding: 24px;
    }
    .register-card {
      width: 100%;
      max-width: 480px;
      padding: 24px;
      border-radius: 16px;
    }
    .logo-area {
      display: flex;
      align-items: center;
      gap: 12px;
      justify-content: center;
      width: 100%;
      margin-bottom: 4px;
    }
    .logo-icon { font-size: 40px; width: 40px; height: 40px; color: #1a237e; }
    .logo-text { font-size: 24px; font-weight: 700; color: #1a237e; margin: 0; }
    .subtitle { text-align: center; color: #666; margin: 0 0 16px; width: 100%; }
    .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .full-width { width: 100%; }
    .submit-btn { margin-top: 8px; height: 44px; font-size: 16px; }
    .error-message { color: #f44336; font-size: 13px; margin: 4px 0 8px; text-align: center; }
    .success-message { color: #4caf50; font-size: 13px; margin: 4px 0 8px; text-align: center; }
    .login-link { text-align: center; margin-top: 16px; font-size: 14px; color: #555; }
    .login-link a { color: #1a237e; font-weight: 600; text-decoration: none; margin-left: 4px; }
    .login-link a:hover { text-decoration: underline; }
  `]
})
export class RegisterComponent {
  private auth = inject(KeycloakService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  form = this.fb.group({
    prenom: ['', Validators.required],
    nom: ['', Validators.required],
    matricule: ['', Validators.required],
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    poste: ['', Validators.required],
    departement: ['', Validators.required],
    dateEmbauche: [''],
    role: ['', Validators.required],
  });

  loading = signal(false);
  hidePassword = signal(true);
  errorMessage = signal('');
  successMessage = signal('');

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const { prenom, nom, matricule, username, email, password, poste, departement, dateEmbauche, role } = this.form.value;

    this.auth.register({
      prenom: prenom!,
      nom: nom!,
      matricule: matricule!,
      username: username!,
      email: email!,
      password: password!,
      poste: poste!,
      departement: departement!,
      dateEmbauche: dateEmbauche || undefined,
      role: role!
    }).subscribe({
        next: () => {
          this.loading.set(false);
          this.successMessage.set('Compte créé avec succès ! Redirection vers la connexion...');
          setTimeout(() => this.router.navigate(['/login']), 2000);
        },
        error: (err) => {
          this.loading.set(false);
          if (err.status === 409) {
            this.errorMessage.set('Nom d\'utilisateur ou email déjà utilisé.');
          } else if (err.error?.message) {
            this.errorMessage.set(err.error.message);
          } else {
            this.errorMessage.set('Erreur lors de la création du compte. Veuillez réessayer.');
          }
        }
      });
  }
}
