import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Employee } from '../models/employee.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrls.employees;

  // GET /api/employees - MANAGER ou HR
  getAll(): Observable<Employee[]> {
    return this.http.get<Employee[]>(this.baseUrl);
  }

  // GET /api/employees/current - Récupérer l'utilisateur connecté (depuis JWT)
  getCurrentUser(): Observable<Employee> {
    return this.http.get<Employee>(`${this.baseUrl}/current`);
  }

  // GET /api/employees/{id} - MANAGER ou HR
  getById(id: number): Observable<Employee> {
    return this.http.get<Employee>(`${this.baseUrl}/${id}`);
  }

  // POST /api/employees - HR uniquement
  create(employee: Employee): Observable<Employee> {
    return this.http.post<Employee>(this.baseUrl, employee);
  }

  // PUT /api/employees/{id} - HR uniquement
  update(id: number, employee: Employee): Observable<Employee> {
    return this.http.put<Employee>(`${this.baseUrl}/${id}`, employee);
  }

  // DELETE /api/employees/{id} - HR uniquement
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // GET /api/employees/role/{role} - HR uniquement
  getByRole(role: string): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${this.baseUrl}/role/${role}`);
  }

  // GET /api/employees/team/{teamId} - MANAGER ou HR
  getByTeam(teamId: number): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${this.baseUrl}/team/${teamId}`);
  }

  // PATCH /api/employees/{userId}/team/{teamId} - HR uniquement
  assignToTeam(userId: number, teamId: number): Observable<Employee> {
    return this.http.patch<Employee>(`${this.baseUrl}/${userId}/team/${teamId}`, {});
  }

  // PATCH /api/employees/{userId}/manager/{managerId} - HR uniquement
  assignManager(userId: number, managerId: number): Observable<Employee> {
    return this.http.patch<Employee>(`${this.baseUrl}/${userId}/manager/${managerId}`, {});
  }
}
