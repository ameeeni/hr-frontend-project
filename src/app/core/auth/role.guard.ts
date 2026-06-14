import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { KeycloakService } from './keycloak.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const keycloak = inject(KeycloakService);
  const router = inject(Router);
  const requiredRoles: string[] = route.data['roles'] ?? [];

  if (!keycloak.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  const hasRole = requiredRoles.length === 0 || requiredRoles.some(role => keycloak.hasRole(role));
  if (!hasRole) {
    router.navigate(['/unauthorized']);
    return false;
  }
  return true;
};
