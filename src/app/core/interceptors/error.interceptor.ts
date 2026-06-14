import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { KeycloakService } from '../auth/keycloak.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const keycloak = inject(KeycloakService);

  // Ne pas intercepter les erreurs des endpoints d'auth (validate, login) – gérées localement
  const isAuthUrl = req.url.includes('/api/v1/auth/');

  // Les appels API de données (employees, leaves, payroll, dashboard) ne doivent pas
  // rediriger vers /unauthorized — la page gère elle-même l'erreur.
  // Seul un 401 global (token expiré) force le logout.
  const isDataApi = req.url.includes('/api/employees') ||
                    req.url.includes('/api/leaves') ||
                    req.url.includes('/api/payroll') ||
                    req.url.includes('/api/dashboard');

  return next(req).pipe(
    catchError(err => {
      if (!isAuthUrl && err.status === 401) {
        // Token expiré ou invalide → déconnexion
        keycloak.logout();
      } else if (!isAuthUrl && !isDataApi && err.status === 403) {
        // 403 sur une route de navigation (pas un appel data) → accès refusé
        router.navigate(['/unauthorized']);
      }
      // Pour les appels data en 403, on laisse le composant gérer l'erreur
      return throwError(() => err);
    })
  );
};


