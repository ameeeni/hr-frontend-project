import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Payroll } from '../models/payroll.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PayrollService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrls.payroll;

  getAll(): Observable<Payroll[]> {
    return this.http.get<Payroll[]>(this.baseUrl);
  }

  getByEmployee(employeeId: number): Observable<Payroll[]> {
    return this.http.get<Payroll[]>(`${this.baseUrl}/employee/${employeeId}`);
  }

  getById(id: number): Observable<Payroll> {
    return this.http.get<Payroll>(`${this.baseUrl}/${id}`);
  }

  generate(employeeId: number, month: number, year: number): Observable<Payroll> {
    return this.http.post<Payroll>(`${this.baseUrl}/generate`, { employeeId, month, year });
  }

  process(id: number): Observable<Payroll> {
    return this.http.put<Payroll>(`${this.baseUrl}/${id}/process`, {});
  }

  markAsPaid(id: number): Observable<Payroll> {
    return this.http.put<Payroll>(`${this.baseUrl}/${id}/paid`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
