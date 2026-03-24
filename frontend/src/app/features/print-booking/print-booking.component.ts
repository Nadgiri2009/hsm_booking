import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BookingService } from '../../core/services/booking.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-print-booking',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <div class="print-page">
      <div class="page-header">
        <h1>{{ activeTab === 'print' ? 'Print Booking Details' : 'Booking Cancellation' }}</h1>
        <p>{{ activeTab === 'print' ? 'Search and download your booking receipt' : 'Request cancellation and verify using OTP' }}</p>
      </div>

      <div class="tab-switch">
        <button [class.active]="activeTab === 'print'" (click)="activeTab = 'print'">Print Receipt</button>
        <button [class.active]="activeTab === 'cancel'" (click)="activeTab = 'cancel'">Cancel Booking</button>
      </div>

      <div class="search-section" *ngIf="activeTab === 'print'">
        <form [formGroup]="searchForm" (ngSubmit)="search()">
          <div class="search-box">
            <select formControlName="search_type">
              <option value="booking_id">Booking ID</option>
              <option value="mobile">Mobile Number</option>
            </select>
            <input type="text" formControlName="query" placeholder="Enter Booking ID or Mobile Number">
            <button type="submit" [disabled]="searchForm.invalid || loading">{{ loading ? 'Searching...' : '🔍 Search' }}</button>
          </div>
        </form>
      </div>

      <div class="cancel-section" *ngIf="activeTab === 'cancel'">
        <form class="cancel-form" [formGroup]="cancelForm" (ngSubmit)="requestCancellation()">
          <div class="form-row">
            <div class="form-group">
              <label>Booking ID *</label>
              <input type="text" formControlName="booking_id" placeholder="Enter approved booking ID">
            </div>
            <div class="form-group">
              <label>Reason *</label>
              <input type="text" formControlName="reason" placeholder="Cancellation reason">
            </div>
          </div>
          <button type="submit" class="btn-cancel" [disabled]="cancelForm.invalid || cancellationLoading">
            {{ cancellationLoading ? 'Processing...' : 'Request Cancellation' }}
          </button>
        </form>

        <div class="refund-info" *ngIf="cancellationMeta">
          <p><strong>Refund Eligibility:</strong> {{ cancellationMeta.refund_percentage }}%</p>
          <p><strong>Estimated Refund Amount:</strong> ₹{{ cancellationMeta.refund_amount | number }}</p>
          <p>OTP has been generated. Enter OTP below to complete cancellation.</p>
        </div>

        <form class="otp-form" [formGroup]="otpForm" (ngSubmit)="verifyCancellationOtp()" *ngIf="cancellationMeta">
          <div class="form-row">
            <div class="form-group">
              <label>Cancellation Request ID *</label>
              <input type="number" formControlName="cancellation_id" readonly>
            </div>
            <div class="form-group">
              <label>OTP *</label>
              <input type="text" formControlName="otp" placeholder="Enter 6-digit OTP" maxlength="6">
            </div>
          </div>
          <button type="submit" class="btn-otp" [disabled]="otpForm.invalid || otpLoading">
            {{ otpLoading ? 'Verifying...' : 'Verify OTP & Confirm Cancellation' }}
          </button>
        </form>

        <div class="success-box" *ngIf="cancelSuccessMsg">{{ cancelSuccessMsg }}</div>
        <div class="error-box" *ngIf="cancelErrorMsg">{{ cancelErrorMsg }}</div>
      </div>

      <div class="results" *ngIf="activeTab === 'print' && bookings.length">
        <div class="booking-card" *ngFor="let b of bookings">
          <div class="booking-id">{{ b.booking_id }}</div>
          <div class="booking-details">
            <div class="detail-row"><span>Applicant</span><strong>{{ b.full_name }}</strong></div>
            <div class="detail-row"><span>Premise</span><strong>{{ b.premise_name }}</strong></div>
            <div class="detail-row"><span>Date</span><strong>{{ b.from_date }} to {{ b.to_date }}</strong></div>
            <div class="detail-row"><span>Amount</span><strong>₹{{ b.amount | number }}</strong></div>
            <div class="detail-row"><span>Status</span><strong class="status" [class]="b.status">{{ b.status }}</strong></div>
          </div>
          <button class="btn-download" (click)="downloadByBooking(b)">📥 Download Receipt</button>
        </div>
      </div>
      <div class="no-results" *ngIf="activeTab === 'print' && searched && !bookings.length">
        <p>No booking found for the given details.</p>
      </div>
    </div>`,
  styles: [`
    .print-page { background: transparent; min-height: 100vh; }
    .page-header { background:linear-gradient(120deg,var(--ocean-deep),var(--ocean)); color:#fff8ef; text-align:center; padding:3rem 1rem; }
    .tab-switch {
      max-width: 900px;
      margin: 1rem auto 0;
      padding: 0 1.5rem;
      display: flex;
      gap: .6rem;
    }
    .tab-switch button {
      border: 1px solid rgba(18,93,110,.18);
      background: rgba(255,255,255,.88);
      color: var(--ocean-deep);
      border-radius: 999px;
      padding: .55rem .95rem;
      cursor: pointer;
      font-weight: 600;
    }
    .tab-switch button.active {
      background: linear-gradient(135deg,var(--ocean),#0d7488);
      color: #fff;
    }
    .search-section { max-width:900px; margin:2rem auto; padding:0 1.5rem; }
    .search-box { display:flex; gap:.5rem; background:white; border-radius:8px; padding:1.25rem; box-shadow:0 2px 12px rgba(0,0,0,.08); }
    .search-box select { padding:.65rem; border:1px solid #ddd; border-radius:6px; min-width:150px; }
    .search-box input { flex:1; padding:.65rem; border:1px solid #ddd; border-radius:6px; font-size:.95rem; }
    .search-box button { background:linear-gradient(135deg,var(--ocean),#0d7488); color:white; border:none; padding:.65rem 1.5rem; border-radius:999px; cursor:pointer; font-weight:600; }

    .results { max-width:900px; margin:0 auto; padding:0 1.5rem 2rem; display:flex; flex-direction:column; gap:1rem; }
    .booking-card { background:white; border-radius:10px; padding:1.25rem; box-shadow:0 2px 8px rgba(0,0,0,.08); border-left:4px solid var(--ocean); }
    .booking-id { font-size:1.1rem; font-weight:700; color:var(--ocean-deep); margin-bottom:1rem; }
    .detail-row { display:flex; justify-content:space-between; padding:.4rem 0; border-bottom:1px solid #f5f5f5; font-size:.88rem; }
    .status.approved { color:#2e7d32; } .status.pending { color:#e65100; } .status.cancelled { color:#c62828; }
    .btn-download { margin-top:1rem; background:linear-gradient(135deg,var(--brand),var(--brand-deep)); color:white; border:none; padding:.6rem 1.5rem; border-radius:999px; cursor:pointer; font-weight:600; width:100%; }

    .cancel-section { max-width:900px; margin:1.2rem auto 2rem; padding:0 1.5rem; }
    .cancel-form, .otp-form {
      background: #fff;
      border-radius: 10px;
      padding: 1rem;
      box-shadow: 0 2px 8px rgba(0,0,0,.08);
      margin-bottom: 1rem;
    }
    .form-row { display:grid; grid-template-columns:1fr 1fr; gap:.75rem; }
    .form-group { display:flex; flex-direction:column; gap:.35rem; }
    .form-group label { font-size:.84rem; font-weight:600; color:#303853; }
    .form-group input {
      border:1px solid #d3d8ef;
      border-radius:6px;
      padding:.6rem .75rem;
      font-size:.9rem;
    }
    .btn-cancel, .btn-otp {
      width:100%;
      border:none;
      border-radius:6px;
      padding:.7rem 1rem;
      color:#fff;
      font-weight:700;
      cursor:pointer;
      margin-top:.8rem;
    }
    .btn-cancel { background:linear-gradient(135deg,var(--brand),var(--brand-deep)); }
    .btn-otp { background:linear-gradient(135deg,var(--ocean),#0d7488); }
    .btn-cancel:disabled, .btn-otp:disabled { opacity:.6; cursor:not-allowed; }
    .refund-info {
      background:#fff8e1;
      border:1px solid #ffcc80;
      color:#5d4300;
      border-radius:8px;
      padding:.9rem 1rem;
      margin-bottom:1rem;
      font-size:.9rem;
    }
    .success-box {
      background:#e8f5e9;
      border:1px solid #a5d6a7;
      color:#2e7d32;
      border-radius:8px;
      padding:.8rem;
      font-size:.9rem;
    }
    .error-box {
      background:#ffebee;
      border:1px solid #ef9a9a;
      color:#b71c1c;
      border-radius:8px;
      padding:.8rem;
      font-size:.9rem;
      margin-top:.8rem;
    }

    .no-results { text-align:center; padding:3rem; color:#666; }

    @media (max-width: 640px) {
      .search-box { flex-direction: column; }
      .form-row { grid-template-columns:1fr; }
      .tab-switch { flex-direction:column; }
    }
  `]
})
export class PrintBookingComponent {
  activeTab: 'print' | 'cancel' = 'print';
  searchForm: FormGroup;
  cancelForm: FormGroup;
  otpForm: FormGroup;
  bookings: any[] = [];
  loading = false; searched = false;
  cancellationLoading = false;
  otpLoading = false;
  cancellationMeta: { cancellation_id: number; refund_percentage: number; refund_amount: number } | null = null;
  cancelSuccessMsg = '';
  cancelErrorMsg = '';

  constructor(
    private fb: FormBuilder,
    private bookingService: BookingService,
    private route: ActivatedRoute
  ) {
    this.searchForm = this.fb.group({ search_type: ['booking_id'], query: ['', Validators.required] });
    this.cancelForm = this.fb.group({
      booking_id: ['', Validators.required],
      reason: ['', [Validators.required, Validators.minLength(5)]]
    });
    this.otpForm = this.fb.group({
      cancellation_id: ['', Validators.required],
      otp: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]]
    });

    this.route.queryParamMap.subscribe((params) => {
      this.activeTab = params.get('action') === 'cancel' ? 'cancel' : 'print';
    });
  }

  search(): void {
    this.loading = true; this.searched = false;
    const query = this.searchForm.value.query?.trim();

    this.bookingService.getBookingByIdOrMobile(query).subscribe({
      next: (rows: any) => {
        const list = Array.isArray(rows) ? rows : (rows?.results || rows?.data || []);
        this.bookings = list.map((b: any) => ({
          id: b.id,
          booking_id: b.booking_id,
          full_name: b.full_name || b.name || '-',
          premise_name: b.premise_name || b.premise || '-',
          from_date: b.from_date || '-',
          to_date: b.to_date || '-',
          amount: Number(b.total_payable || b.amount || 0),
          status: b.status || 'pending'
        }));
        this.searched = true;
        this.loading = false;
      },
      error: () => {
        this.bookings = [];
        this.searched = true;
        this.loading = false;
      }
    });
  }

  downloadByBooking(booking: any): void {
    const downloadId = String(booking?.id || booking?.booking_id || '');
    if (!downloadId) return;
    this.bookingService.downloadReceipt(downloadId).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Receipt_${booking.booking_id || downloadId}.pdf`;
      a.click();
    });
  }

  requestCancellation(): void {
    if (this.cancelForm.invalid) {
      this.cancelForm.markAllAsTouched();
      return;
    }

    this.cancellationLoading = true;
    this.cancelErrorMsg = '';
    this.cancelSuccessMsg = '';

    this.bookingService.cancelBooking(this.cancelForm.value).subscribe({
      next: (res) => {
        this.cancellationMeta = {
          cancellation_id: Number(res?.cancellation_id),
          refund_percentage: Number(res?.refund_percentage || 0),
          refund_amount: Number(res?.refund_amount || 0)
        };
        this.otpForm.patchValue({ cancellation_id: this.cancellationMeta.cancellation_id });
        this.cancellationLoading = false;
      },
      error: (err) => {
        this.cancellationLoading = false;
        this.cancellationMeta = null;
        this.cancelErrorMsg = err?.error?.error || 'Unable to initiate cancellation. Please check Booking ID and try again.';
      }
    });
  }

  verifyCancellationOtp(): void {
    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }

    this.otpLoading = true;
    this.cancelErrorMsg = '';
    this.cancelSuccessMsg = '';

    this.bookingService.verifyOtp(this.otpForm.value).subscribe({
      next: (res) => {
        this.otpLoading = false;
        this.cancelSuccessMsg = res?.message || 'Cancellation verified successfully.';
      },
      error: (err) => {
        this.otpLoading = false;
        this.cancelErrorMsg = err?.error?.error || 'Invalid or expired OTP.';
      }
    });
  }
}
