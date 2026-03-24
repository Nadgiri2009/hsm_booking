import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Premise, PremiseRate, TimeSlot, Holiday } from '../models/booking.model';

@Injectable({ providedIn: 'root' })
export class PremiseService {
  private apiUrl = `${environment.apiUrl}/premises`;

  constructor(private http: HttpClient) {}

  getPremises(): Observable<Premise[]> {
    return this.http.get<Premise[]>(`${this.apiUrl}/`);
  }

  getPremise(id: number): Observable<Premise> {
    return this.http.get<Premise>(`${this.apiUrl}/${id}/`);
  }

  getTimeSlots(premiseId: number): Observable<TimeSlot[]> {
    return this.http.get<TimeSlot[]>(`${this.apiUrl}/${premiseId}/slots/`);
  }

  getHolidays(): Observable<Holiday[]> {
    return this.http.get<Holiday[]>(`${this.apiUrl}/holidays/`);
  }

  // Admin
  createPremise(data: Partial<Premise>): Observable<Premise> {
    return this.http.post<Premise>(`${this.apiUrl}/admin/`, data);
  }

  updatePremise(id: number, data: Partial<Premise>): Observable<Premise> {
    return this.http.put<Premise>(`${this.apiUrl}/admin/${id}/`, data);
  }

  deletePremise(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/${id}/`);
  }

  updateRate(premiseId: number, data: Partial<PremiseRate>): Observable<PremiseRate> {
    return this.http.post<PremiseRate>(`${this.apiUrl}/admin/${premiseId}/rates/`, data);
  }

  createHoliday(data: Partial<Holiday>): Observable<Holiday> {
    return this.http.post<Holiday>(`${this.apiUrl}/admin/holidays/`, data);
  }

  deleteHoliday(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/holidays/${id}/`);
  }
}
