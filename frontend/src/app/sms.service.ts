import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SmsPayload {
  smsMsg: string;
  mobileNo: string;
  dltTeId?: string;
}

export interface SmsResponse {
  status: string;
  http_status?: number;
  provider_response?: string;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class SmsService {
  private apiUrl = 'http://localhost:8000/api/send-sms/';

  constructor(private http: HttpClient) {}

  sendSms(payload: SmsPayload): Observable<SmsResponse> {
    return this.http.post<SmsResponse>(this.apiUrl, payload);
  }
}
