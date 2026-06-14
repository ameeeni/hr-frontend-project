import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Team, TeamMember } from '../models/team.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TeamService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrls.teams;

  // POST /api/teams - HR uniquement
  create(team: Team): Observable<Team> {
    return this.http.post<Team>(this.baseUrl, team);
  }

  // GET /api/teams/{id} - MANAGER ou HR
  getById(id: number): Observable<Team> {
    return this.http.get<Team>(`${this.baseUrl}/${id}`);
  }

  // GET /api/teams - MANAGER ou HR
  getAll(): Observable<Team[]> {
    return this.http.get<Team[]>(this.baseUrl);
  }

  // GET /api/teams/with-members - MANAGER ou HR
  getWithMembers(): Observable<Team[]> {
    return this.http.get<Team[]>(`${this.baseUrl}/with-members`);
  }

  // PUT /api/teams/{id} - HR uniquement
  update(id: number, team: Team): Observable<Team> {
    return this.http.put<Team>(`${this.baseUrl}/${id}`, team);
  }

  // DELETE /api/teams/{id} - HR uniquement
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // POST /api/teams/{teamId}/members/{userId} - HR uniquement
  addMember(teamId: number, userId: number): Observable<Team> {
    return this.http.post<Team>(`${this.baseUrl}/${teamId}/members/${userId}`, {});
  }

  // DELETE /api/teams/{teamId}/members/{userId} - HR uniquement
  removeMember(teamId: number, userId: number): Observable<Team> {
    return this.http.delete<Team>(`${this.baseUrl}/${teamId}/members/${userId}`);
  }

  // GET /api/teams/{teamId}/members - MANAGER ou HR
  getMembers(teamId: number): Observable<TeamMember[]> {
    return this.http.get<TeamMember[]>(`${this.baseUrl}/${teamId}/members`);
  }

  // GET /api/teams/search?nom=... - MANAGER ou HR
  searchByNom(nom: string): Observable<Team> {
    return this.http.get<Team>(`${this.baseUrl}/search`, { params: { nom } });
  }
}
