import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CreateOrderPayload {
  amount: number; // in paise
  currency?: string;
  receipt?: string;
}

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export interface VerifyPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private createUrl = 'http://localhost:8000/api/payment/create/';
  private verifyUrl = 'http://localhost:8000/api/payment/verify/';

  constructor(private http: HttpClient) {}

  createOrder(payload: CreateOrderPayload): Observable<CreateOrderResponse> {
    return this.http.post<CreateOrderResponse>(this.createUrl, payload);
  }

  verifyPayment(payload: VerifyPayload): Observable<any> {
    return this.http.post<any>(this.verifyUrl, payload);
  }
}
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Payment, Cancellation, Complaint } from '../models/booking.model';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private apiUrl = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) {}

  getPayments(page = 1): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/?page=${page}`);
  }

  confirmPayment(bookingId: string, transactionId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/confirm/`, { bookingId, transactionId });
  }

  getCancellations(page = 1): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/cancellations/?page=${page}`);
  }

  requestCancellation(bookingId: string, reason: string, otp?: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/cancellations/request/`, { bookingId, reason, otp });
  }

  approveCancellation(id: number): Observable<any> {
    return this.http.post(`${environment.apiUrl}/cancellations/admin/${id}/approve/`, {});
  }

  rejectCancellation(id: number, reason: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/cancellations/admin/${id}/reject/`, { reason });
  }

  getComplaints(page = 1): Observable<any> {
    return this.http.get(`${environment.apiUrl}/complaints/admin/?page=${page}`);
  }

  submitComplaint(data: Partial<Complaint>): Observable<any> {
    return this.http.post(`${environment.apiUrl}/complaints/submit/`, data);
  }

  updateComplaintStatus(id: number, status: string): Observable<any> {
    return this.http.patch(`${environment.apiUrl}/complaints/admin/${id}/`, { status });
  }
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private http: HttpClient) {}

  getDashboardStats(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/admin/dashboard/stats/`);
  }
}
