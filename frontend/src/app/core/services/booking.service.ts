import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';
import { Booking, BookingAvailability, BookingSummary, Premise, TimeSlot } from '../models/booking.model';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private bookingDataSubject = new BehaviorSubject<Partial<Booking>>({});
  bookingData$ = this.bookingDataSubject.asObservable();

  private currentStepSubject = new BehaviorSubject<number>(1);
  currentStep$ = this.currentStepSubject.asObservable();

  constructor(private api: ApiService) {}

  updateBookingData(data: Partial<Booking>): void {
    this.bookingDataSubject.next({ ...this.bookingDataSubject.value, ...data });
  }

  getBookingData(): Partial<Booking> {
    return this.bookingDataSubject.value;
  }

  setStep(step: number): void {
    this.currentStepSubject.next(step);
  }

  resetBooking(): void {
    this.bookingDataSubject.next({});
    this.currentStepSubject.next(1);
  }

  // API Calls
  getPremises(): Observable<Premise[]> {
    return this.api.get<Premise[]>('premises/');
  }

  getTimeSlots(premiseId: number): Observable<TimeSlot[]> {
    return this.api.get<TimeSlot[]>(`premises/${premiseId}/slots/`);
  }

  checkAvailability(premiseId: number, date: string): Observable<BookingAvailability> {
    return this.api.get<BookingAvailability>('bookings/availability/', { premise_id: premiseId, date });
  }

  checkAvailabilityRange(premiseId: number, fromDate: string, toDate: string, slotId?: number): Observable<any> {
    const params: any = { premise_id: premiseId, from_date: fromDate, to_date: toDate };
    if (slotId) params.slot_id = slotId;
    return this.api.get<any>('bookings/availability-range/', params);
  }

  calculateSummary(data: any): Observable<BookingSummary> {
    return this.api.post<BookingSummary>('bookings/calculate/', data);
  }

  createBooking(formData: FormData): Observable<Booking> {
    return this.api.postFormData<Booking>('bookings/', formData);
  }

  // Payment related API calls
  createPaymentOrder(amount: number, receipt: string): Observable<any> {
    return this.api.post<any>('payment/create/', { amount, receipt });
  }

  verifyPayment(payload: any): Observable<any> {
    return this.api.post<any>('payment/verify/', payload);
  }

  sendSms(mobile: string, message: string): Observable<any> {
    return this.api.post<any>('send-sms/', { mobileNo: mobile, smsMsg: message });
  }

  getBookingByIdOrMobile(query: string): Observable<Booking[]> {
    return this.api.get<Booking[]>('bookings/lookup/', { query });
  }

  downloadReceipt(bookingId: string): Observable<Blob> {
    return this.api.downloadPdf(`bookings/${bookingId}/receipt/`);
  }

  cancelBooking(data: any): Observable<any> {
    return this.api.post<any>('cancellations/request/', data);
  }

  verifyOtp(data: any): Observable<any> {
    return this.api.post<any>('cancellations/verify-otp/', data);
  }
}
