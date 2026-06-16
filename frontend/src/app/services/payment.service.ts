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

