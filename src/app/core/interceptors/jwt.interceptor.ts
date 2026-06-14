import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { KeycloakService } from '../auth/keycloak.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  // Ne pas ajouter le token sur les appels d'authentification (login/register).
  // Les URLs peuvent être absolues (avec environment.iamUrl) ou relatives via le proxy ('/api/...').
  const isAuthUrl = req.url.includes('/api/v1/auth/');
  if (isAuthUrl) {
    return next(req);
  }

  const keycloak = inject(KeycloakService);
  const token = keycloak.getStoredToken();
  if (token) {
    return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
  }
  return next(req);
};
