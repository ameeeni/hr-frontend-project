import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Leave } from '../models/leave.model';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class LeaveService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrls.leaves;

  // GET /api/leaves - HR uniquement
  getAll(): Observable<Leave[]> {
    return this.http.get<any[]>(this.baseUrl).pipe(map(list => list.map(mapFromBackend)));
  }

  // GET /api/leaves/employee/{employeeId}/history - tous les rôles
  getForEmployee(employeeId: number): Observable<Leave[]> {
    return this.http.get<any[]>(`${this.baseUrl}/employee/${employeeId}/history`)
      .pipe(map(list => list.map(mapFromBackend)));
  }

  // GET /api/leaves/employee/{employeeId}/requests?status=... (nouveau endpoint corrigé)
  getEmployeeRequests(employeeId: number, status?: string): Observable<Leave[]> {
    const url = `${this.baseUrl}/employee/${employeeId}/requests`;
    const options = status ? { params: { status } } : undefined;
    return this.http.get<any[]>(url, options).pipe(map(list => list.map(mapFromBackend)));
  }

  // POST /api/leaves/employee/{employeeId} - tous les rôles
  submitForEmployee(employeeId: number, payload: any): Observable<Leave> {
    return this.http.post<any>(`${this.baseUrl}/employee/${employeeId}`, payload)
      .pipe(map(mapFromBackend));
  }

  // POST /api/leaves/submit - Soumet pour l'utilisateur connecté (JWT)
  // Le backend récupère automatiquement l'ID depuis le JWT
  submit(payload: any): Observable<Leave> {
    return this.http.post<any>(`${this.baseUrl}/submit`, payload)
      .pipe(map(mapFromBackend));
  }

  // PATCH /api/leaves/{requestId}/cancel/employee/{employeeId} - EMPLOYEE ou MANAGER
  cancel(requestId: number, employeeId: number): Observable<Leave> {
    return this.http.patch<any>(`${this.baseUrl}/${requestId}/cancel/employee/${employeeId}`, {})
      .pipe(map(mapFromBackend));
  }

  // PATCH /api/leaves/{requestId}/validate/validator/{validatorId} - MANAGER ou HR
  validate(requestId: number, validatorId: number, decision: any): Observable<Leave> {
    return this.http.patch<any>(`${this.baseUrl}/${requestId}/validate/validator/${validatorId}`, decision)
      .pipe(map(mapFromBackend));
  }

  // GET /api/leaves/{id} - tous les rôles
  getById(id: number): Observable<Leave> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(map(mapFromBackend));
  }

  // GET /api/leaves/team/{teamId}/pending - MANAGER ou HR
  getPendingByTeam(teamId: number): Observable<Leave[]> {
    return this.http.get<any[]>(`${this.baseUrl}/team/${teamId}/pending`)
      .pipe(map(list => list.map(mapFromBackend)));
  }

  // GET /api/leaves/status/{status} - HR uniquement
  getByStatus(status: string): Observable<Leave[]> {
    return this.http.get<any[]>(`${this.baseUrl}/status/${status}`)
      .pipe(map(list => list.map(mapFromBackend)));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}

function mapFromBackend(b: any): Leave {
  // backend uses French field names: dateDebut, dateFin, motif, nombreJours
  // status values: PENDING, APPROVED, REJECTED, CANCELLED
  // type values: CONGE_ANNUEL, MALADIE, TELETRAVAIL
  return {
    id: b.id,
    employeeId: b.employee?.id ?? b.employeeId ?? null,
    employeeName: b.employee?.nom ?? b.employeeName ?? b.employee?.username ?? null,
    type: b.type ?? b.leaveType,
    startDate: b.dateDebut ?? b.startDate,
    endDate: b.dateFin ?? b.endDate,
    numberOfDays: b.nombreJours ?? b.numberOfDays,
    reason: b.motif ?? b.reason,
    status: b.status ?? b.etat ?? 'PENDING',
    approvedBy: b.validatedBy?.nom ?? b.approvedBy,
    approvedAt: b.dateValidation ?? b.approvedAt,
    validatorComment: b.commentaireValidateur ?? b.validatorComment,
    createdAt: b.createdAt
  } as Leave;
}
