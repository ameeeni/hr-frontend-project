import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [MatCardModule, MatIconModule, RouterLink, MatButtonModule],
  template: `
    <div class="unauthorized-container">
      <mat-card class="unauthorized-card">
        <mat-card-content>
          <mat-icon class="error-icon">lock</mat-icon>
          <h1>Accès refusé</h1>
          <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
end  chn          <button mat-raised-button color="primary" routerLink="/app/dashboard">
            Retour au tableau de bord
          </button>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .unauthorized-container { display: flex; justify-content: center; align-items: center; height: 80vh; }
    .unauthorized-card { text-align: center; padding: 40px; max-width: 400px; }
    .error-icon { font-size: 80px; width: 80px; height: 80px; color: #f44336; }
    h1 { margin: 20px 0 10px; }
    p { color: #666; margin-bottom: 24px; }
  `]
})
export class UnauthorizedComponent {}
