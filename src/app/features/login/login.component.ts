import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { KeycloakService } from '../../core/auth/keycloak.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <div class="logo-area">
            <mat-icon class="logo-icon">business</mat-icon>
            <h1 class="logo-text">HR Manager</h1>
          </div>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nom d'utilisateur</mat-label>
              <input matInput formControlName="username" autocomplete="username"
                (input)="onInput('username', $event)" />
              <mat-icon matPrefix>person</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Mot de passe</mat-label>
              <input matInput [type]="hidePassword() ? 'password' : 'text'" formControlName="password" autocomplete="current-password"
                (input)="onInput('password', $event)" />
              <mat-icon matPrefix>lock</mat-icon>
              <button mat-icon-button matSuffix type="button" (click)="hidePassword.set(!hidePassword())">
                <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </mat-form-field>

            @if (errorMessage()) {
              <p class="error-message">{{ errorMessage() }}</p>
            }

            <button
              mat-raised-button
              color="primary"
              class="full-width submit-btn"
              type="submit"
              [disabled]="loading()">
              @if (loading()) {
                <mat-spinner diameter="20" />
              } @else {
                Se connecter
              }
            </button>

            <div class="register-link">
              Pas encore de compte ?
              <a routerLink="/register">Créer un compte</a>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1a237e 0%, #283593 100%);
    }
    .login-card {
      width: 100%;
      max-width: 420px;
      padding: 24px;
      border-radius: 16px;
    }
    .logo-area {
      display: flex;
      align-items: center;
      gap: 12px;
      justify-content: center;
      width: 100%;
      margin-bottom: 16px;
    }
    .logo-icon { font-size: 40px; width: 40px; height: 40px; color: #1a237e; }
    .logo-text { font-size: 24px; font-weight: 700; color: #1a237e; margin: 0; }
    .full-width { width: 100%; }
    .submit-btn { margin-top: 8px; height: 44px; font-size: 16px; }
    .error-message { color: #f44336; font-size: 13px; margin: 4px 0 8px; text-align: center; }
    .register-link { text-align: center; margin-top: 16px; font-size: 14px; color: #555; }
    .register-link a { color: #1a237e; font-weight: 600; text-decoration: none; margin-left: 4px; }
    .register-link a:hover { text-decoration: underline; }
  `]
})
export class LoginComponent {
  private auth = inject(KeycloakService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  loading = signal(false);
  errorMessage = signal('');
  hidePassword = signal(true);

  onInput(field: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.form.get(field)?.setValue(value, { emitEvent: true });
    this.form.get(field)?.markAsDirty();
  }

  onSubmit(): void {
    // Patch values from DOM in case autofill didn't trigger Angular
    const usernameEl = document.querySelector('input[formControlName="username"]') as HTMLInputElement;
    const passwordEl = document.querySelector('input[formControlName="password"]') as HTMLInputElement;
    if (usernameEl?.value) this.form.get('username')?.setValue(usernameEl.value);
    if (passwordEl?.value) this.form.get('password')?.setValue(passwordEl.value);

    const { username, password } = this.form.value;
    if (!username || !password) {
      this.errorMessage.set('Veuillez remplir tous les champs.');
      return;
    }
    this.loading.set(true);
    this.errorMessage.set('');
    this.auth.login(username!, password!).subscribe({
      next: async () => {
        await this.auth.loadUserInfo();
        this.loading.set(false);

        // Redirection selon le rôle (supporter HR et RH)
        if (this.auth.hasRole('HR') || this.auth.hasRole('RH') || this.auth.hasRole('MANAGER')) {
          this.router.navigate(['/app/dashboard']);
        } else if (this.auth.hasRole('EMPLOYEE')) {
          // L'employé va directement à ses demandes de congé
          this.router.navigate(['/app/leaves']);
        } else {
          // Par défaut, aller au dashboard
          this.router.navigate(['/app/dashboard']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 401 || err.status === 403) {
          this.errorMessage.set('Nom d\'utilisateur ou mot de passe incorrect.');
        } else {
          this.errorMessage.set('Erreur de connexion. Veuillez réessayer.');
        }
      }
    });
  }
}
