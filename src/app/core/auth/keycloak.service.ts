import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  username: string;
  email: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  nom: string;
  prenom: string;
  matricule: string;
  poste: string;
  departement: string;
  dateEmbauche?: string;
  role: string;
}

export interface TokenValidationResponse {
  valid: boolean;
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
  userId: number;
}

const ACCESS_TOKEN_KEY = 'iam_access_token';
const REFRESH_TOKEN_KEY = 'iam_refresh_token';
const USER_INFO_KEY = 'iam_user_info';

@Injectable({ providedIn: 'root' })
export class KeycloakService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private baseUrl = `/api/v1/auth`;

  /** Signal réactif — les composants peuvent utiliser computed() dessus */
  readonly userInfo = signal<TokenValidationResponse | null>(null);

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, { username, password }).pipe(
      tap(res => {
        localStorage.setItem(ACCESS_TOKEN_KEY, res.accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);
      })
    );
  }

  register(data: RegisterRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, data);
  }

  async loadUserInfo(): Promise<void> {
    const token = this.getStoredToken();
    if (!token) return;
    try {
      const res = await this.http
        .get<TokenValidationResponse>(`${this.baseUrl}/validate`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .toPromise();
      if (res && res.valid) {
        this.userInfo.set(res);
        localStorage.setItem(USER_INFO_KEY, JSON.stringify(res));
      } else {
        this.clearTokens();
      }
    } catch {
      this.clearTokens();
    }
  }

  async getToken(): Promise<string> {
    return this.getStoredToken() ?? '';
  }

  getStoredToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getUsername(): string {
    return this.getCachedUserInfo()?.username ?? '';
  }

  getFullName(): string {
    return this.getUsername();
  }

  hasRole(role: string): boolean {
    const info = this.getCachedUserInfo();
    if (!info?.roles) return false;

    // Normaliser le rôle recherché (supporter HR et RH)
    const normalizedRole = role.toUpperCase();
    const isHR = normalizedRole === 'HR' || normalizedRole === 'RH' || normalizedRole === 'ROLE_HR' || normalizedRole === 'ROLE_RH';

    return info.roles.some(r => {
      const normalizedR = r.toUpperCase();

      // Vérifier si c'est un rôle HR/RH
      if (isHR && (normalizedR === 'ROLE_HR' || normalizedR === 'ROLE_RH' || normalizedR === 'HR' || normalizedR === 'RH')) {
        return true;
      }

      // Vérification standard pour les autres rôles
      const withPrefix = normalizedRole.startsWith('ROLE_') ? normalizedRole : 'ROLE_' + normalizedRole;
      const withoutPrefix = normalizedRole.startsWith('ROLE_') ? normalizedRole.substring(5) : normalizedRole;

      return normalizedR === withPrefix || normalizedR === withoutPrefix || normalizedR === normalizedRole;
    });
  }

  getUserId(): number | null {
    return this.getCachedUserInfo()?.userId ?? null;
  }

  getRoles(): string[] {
    return this.getCachedUserInfo()?.roles ?? [];
  }

  isLoggedIn(): boolean {
    return !!this.getStoredToken();
  }

  logout(): void {
    this.clearTokens();
    this.router.navigate(['/login']);
  }

  /** Called at app startup – just restore cached user info if token exists */
  async init(): Promise<boolean> {
    const token = this.getStoredToken();
    if (token) {
      // restore from localStorage first so the signal is populated immediately
      const stored = localStorage.getItem(USER_INFO_KEY);
      if (stored) {
        this.userInfo.set(JSON.parse(stored));
      }
      await this.loadUserInfo();
    }
    return true;
  }

  private getCachedUserInfo(): TokenValidationResponse | null {
    if (this.userInfo()) return this.userInfo();
    const stored = localStorage.getItem(USER_INFO_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      this.userInfo.set(parsed);
      return parsed;
    }
    return null;
  }

  private clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_INFO_KEY);
    this.userInfo.set(null);
  }
}
