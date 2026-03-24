import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Booking, BookingCalculation, CreateBookingPayload, PaginatedResponse } from '../models/booking.model';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private apiUrl = `${environment.apiUrl}/bookings`;

  constructor(private http: HttpClient) {}

  createBooking(payload: CreateBookingPayload): Observable<{ bookingId: string; message: string }> {
    return this.http.post<{ bookingId: string; message: string }>(`${this.apiUrl}/create/`, payload);
  }

  calculateBooking(params: {
    premiseId: number;
    startDate: string;
    endDate: string;
    slotId: number;
  }): Observable<BookingCalculation> {
    return this.http.post<BookingCalculation>(`${this.apiUrl}/calculate/`, params);
  }

  getBookedDates(premiseId: number, slotId?: number): Observable<string[]> {
    let p = new HttpParams().set('premise_id', premiseId);
    if (slotId) p = p.set('slot_id', slotId);
    return this.http.get<string[]>(`${this.apiUrl}/booked-dates/`, { params: p });
  }

  getBookingByIdOrMobile(query: string): Observable<Booking> {
    const params = new HttpParams().set('q', query);
    return this.http.get<Booking>(`${this.apiUrl}/lookup/`, { params });
  }

  downloadReceipt(bookingId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${bookingId}/receipt/`, { responseType: 'blob' });
  }

  // Admin APIs
  getAllBookings(page = 1, status?: string): Observable<PaginatedResponse<Booking>> {
    let params = new HttpParams().set('page', page);
    if (status) params = params.set('status', status);
    return this.http.get<PaginatedResponse<Booking>>(`${this.apiUrl}/admin/`, { params });
  }

  approveBooking(bookingId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/${bookingId}/approve/`, {});
  }

  rejectBooking(bookingId: string, reason: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/${bookingId}/reject/`, { reason });
  }

  generateDuplicateReceipt(bookingId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/admin/${bookingId}/duplicate-receipt/`, { responseType: 'blob' });
  }
}
