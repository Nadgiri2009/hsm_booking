import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { BookingService } from '../../core/services/booking.service';
import { LanguageService } from '../../core/services/language.service';
import { Premise, TimeSlot, BookingSummary } from '../../core/models/booking.model';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="booking-page">
      <div class="page-header">
        <h1>{{ lang.get('booking.selectPremise') }}</h1>
        <p>Complete the booking process in 6 easy steps</p>
      </div>

      <!-- Stepper -->
      <div class="stepper">
        <div class="step" *ngFor="let s of steps; let i = index"
          [class.active]="currentStep === i+1"
          [class.completed]="currentStep > i+1">
          <div class="step-circle">{{ currentStep > i+1 ? '✓' : i+1 }}</div>
          <div class="step-label">{{ s }}</div>
        </div>
      </div>

      <div class="booking-body">
        <!-- Step 1: Select Premise -->
        <div class="step-content" *ngIf="currentStep === 1">
          <h2>{{ lang.get('booking.selectPremise') }}</h2>
          <div class="premise-cards">
            <div class="premise-select-card"
              *ngFor="let p of premises"
              [class.selected]="selectedPremise?.id === p.id"
              (click)="selectPremise(p)">
              <h3>{{ p.name }}</h3>
              <p>Capacity: {{ p.capacity }} persons</p>
              <p class="rent">Base Rent: ₹{{ p.base_rent | number }}/day</p>
              <p class="deposit">Security Deposit: ₹{{ p.security_deposit | number }}</p>
            </div>
          </div>
          <button class="btn-next" [disabled]="!selectedPremise" (click)="nextStep()">
            {{ lang.get('booking.proceed') }} →
          </button>
        </div>

        <!-- Step 2: Date & Slot -->
        <div class="step-content" *ngIf="currentStep === 2">
          <h2>{{ lang.get('booking.selectDate') }} & {{ lang.get('booking.selectSlot') }}</h2>
          <form [formGroup]="dateSlotForm">
            <div class="form-row">
              <div class="form-group">
                <label>From Date *</label>
                <input type="date" formControlName="from_date" [min]="today">
              </div>
              <div class="form-group">
                <label>To Date *</label>
                <input type="date" formControlName="to_date" [min]="dateSlotForm.get('from_date')?.value || today">
              </div>
            </div>
            <div class="form-group" *ngIf="timeSlots.length">
              <label>{{ lang.get('booking.selectSlot') }} *</label>
              <div class="slot-grid">
                <div class="slot-card"
                  *ngFor="let slot of timeSlots"
                  [class.selected]="selectedSlot?.id === slot.id"
                  [class.booked]="isSlotBooked(slot.id)"
                  (click)="!isSlotBooked(slot.id) && selectSlot(slot)">
                  <strong>{{ slot.name }}</strong>
                  <span>{{ slot.start_time }} – {{ slot.end_time }}</span>
                  <span *ngIf="isSlotBooked(slot.id)" class="booked-label">Booked</span>
                </div>
              </div>
            </div>
            <div class="warning-box" *ngIf="availabilityMessage">
              {{ availabilityMessage }}
            </div>
          </form>
          <div class="step-nav">
            <button class="btn-back" (click)="prevStep()">← {{ lang.get('booking.back') }}</button>
            <button class="btn-next" [disabled]="!dateSlotForm.valid || !selectedSlot || isSelectedSlotUnavailable()" (click)="loadSummary()">
              {{ lang.get('booking.proceed') }} →
            </button>
          </div>
        </div>

        <!-- Step 3: Booking Summary -->
        <div class="step-content" *ngIf="currentStep === 3">
          <h2>{{ lang.get('booking.summary') }}</h2>
          <div class="summary-table" *ngIf="bookingSummary">
            <div class="summary-row">
              <span>Premise</span><strong>{{ bookingSummary.premise.name }}</strong>
            </div>
            <div class="summary-row">
              <span>Dates</span><strong>{{ bookingSummary.dates.join(', ') }}</strong>
            </div>
            <div class="summary-row">
              <span>Total Days</span><strong>{{ bookingSummary.total_days }}</strong>
            </div>
            <div class="summary-row">
              <span>{{ lang.get('booking.baseRent') }}</span><strong>₹{{ bookingSummary.base_rent | number:'1.2-2' }}</strong>
            </div>
            <div class="summary-row">
              <span>{{ lang.get('booking.holidayCharges') }}</span><strong>₹{{ bookingSummary.holiday_charges | number:'1.2-2' }}</strong>
            </div>
            <div class="summary-row">
              <span>{{ lang.get('booking.securityDeposit') }}</span><strong>₹{{ bookingSummary.security_deposit | number:'1.2-2' }}</strong>
            </div>
            <div class="summary-row">
              <span>{{ lang.get('booking.cgst') }}</span><strong>₹{{ bookingSummary.cgst | number:'1.2-2' }}</strong>
            </div>
            <div class="summary-row">
              <span>{{ lang.get('booking.sgst') }}</span><strong>₹{{ bookingSummary.sgst | number:'1.2-2' }}</strong>
            </div>
            <div class="summary-row total">
              <span>{{ lang.get('booking.totalPayable') }}</span>
              <strong>₹{{ bookingSummary.total_payable | number:'1.2-2' }}</strong>
            </div>
          </div>
          <div class="step-nav">
            <button class="btn-back" (click)="prevStep()">← {{ lang.get('booking.back') }}</button>
            <button class="btn-next" (click)="nextStep()">{{ lang.get('booking.proceed') }} →</button>
          </div>
        </div>

        <!-- Step 4: Applicant Details -->
        <div class="step-content" *ngIf="currentStep === 4">
          <h2>{{ lang.get('booking.applicantDetails') }}</h2>
          <form [formGroup]="applicantForm">
            <div class="form-row">
              <div class="form-group">
                <label>{{ lang.get('booking.name') }} *</label>
                <input type="text" formControlName="full_name" placeholder="Enter full name">
                <span class="error" *ngIf="applicantForm.get('full_name')?.invalid && applicantForm.get('full_name')?.touched">Required</span>
              </div>
              <div class="form-group">
                <label>{{ lang.get('booking.email') }} *</label>
                <input type="email" formControlName="email" placeholder="Enter email">
                <span class="error" *ngIf="applicantForm.get('email')?.invalid && applicantForm.get('email')?.touched">Valid email required</span>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>{{ lang.get('booking.mobile') }} *</label>
                <input type="tel" formControlName="mobile" placeholder="10-digit mobile" maxlength="10">
                <span class="error" *ngIf="applicantForm.get('mobile')?.invalid && applicantForm.get('mobile')?.touched">Valid 10-digit number required</span>
              </div>
              <div class="form-group">
                <label>{{ lang.get('booking.altMobile') }}</label>
                <input type="tel" formControlName="alt_mobile" placeholder="Alternate mobile" maxlength="10">
              </div>
            </div>
            <div class="form-group">
              <label>{{ lang.get('booking.address') }} *</label>
              <textarea formControlName="address" rows="3" placeholder="Complete address"></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>{{ lang.get('booking.functionName') }} *</label>
                <input type="text" formControlName="function_name" placeholder="e.g. Marriage, Conference">
              </div>
              <div class="form-group">
                <label>{{ lang.get('booking.functionType') }} *</label>
                <select formControlName="function_type">
                  <option value="">Select type</option>
                  <option value="marriage">Marriage / Wedding</option>
                  <option value="birthday">Birthday Party</option>
                  <option value="corporate">Corporate Event</option>
                  <option value="conference">Conference / Seminar</option>
                  <option value="exhibition">Exhibition</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>{{ lang.get('booking.guests') }} *</label>
              <input type="number" formControlName="expected_guests" min="1" placeholder="Expected number of guests">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>{{ lang.get('booking.idProof') }} Type *</label>
                <select formControlName="id_proof_type">
                  <option value="aadhaar">Aadhaar Card</option>
                  <option value="pan">PAN Card</option>
                </select>
              </div>
              <div class="form-group">
                <label>ID Proof Number *</label>
                <input type="text" formControlName="id_proof_number"
                  [placeholder]="applicantForm.get('id_proof_type')?.value === 'aadhaar' ? '12-digit Aadhaar' : 'PAN Number'">
              </div>
            </div>
            <div class="form-group">
              <label>Upload ID Proof *</label>
              <input type="file" (change)="onIdProofChange($event)" accept=".pdf,.jpg,.jpeg,.png">
            </div>
          </form>
          <div class="step-nav">
            <button class="btn-back" (click)="prevStep()">← {{ lang.get('booking.back') }}</button>
            <button class="btn-next" [disabled]="applicantForm.invalid" (click)="nextStep()">{{ lang.get('booking.proceed') }} →</button>
          </div>
        </div>

        <!-- Step 5: Bank Details -->
        <div class="step-content" *ngIf="currentStep === 5">
          <h2>{{ lang.get('booking.bankDetails') }}</h2>
          <form [formGroup]="bankForm">
            <div class="form-row">
              <div class="form-group">
                <label>{{ lang.get('booking.bankName') }} *</label>
                <input type="text" formControlName="bank_name" placeholder="Bank name">
              </div>
              <div class="form-group">
                <label>{{ lang.get('booking.accountHolder') }} *</label>
                <input type="text" formControlName="account_holder" placeholder="Account holder name">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>{{ lang.get('booking.accountNumber') }} *</label>
                <input type="text" formControlName="account_number" placeholder="Account number">
              </div>
              <div class="form-group">
                <label>{{ lang.get('booking.ifsc') }} *</label>
                <input
                  type="text"
                  formControlName="ifsc_code"
                  placeholder="e.g. ICIC0001234"
                  maxlength="11"
                  style="text-transform:uppercase"
                  (input)="bankForm.get('ifsc_code')?.setValue(($any($event.target).value || '').toUpperCase(), { emitEvent: false })">
                <span class="error" *ngIf="bankForm.get('ifsc_code')?.hasError('required') && bankForm.get('ifsc_code')?.touched">
                  IFSC is required
                </span>
                <span class="error" *ngIf="bankForm.get('ifsc_code')?.hasError('pattern') && bankForm.get('ifsc_code')?.touched">
                  Use valid IFSC format: 4 letters + 0 + 6 characters (e.g. ICIC0001234)
                </span>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>{{ lang.get('booking.branch') }} *</label>
                <input type="text" formControlName="branch_name" placeholder="Branch name">
              </div>
              <div class="form-group">
                <label>{{ lang.get('booking.micr') }}</label>
                <input type="text" formControlName="micr_code" placeholder="9-digit MICR code" maxlength="9">
              </div>
            </div>
          </form>
          <div class="step-nav">
            <button class="btn-back" (click)="prevStep()">← {{ lang.get('booking.back') }}</button>
            <button class="btn-next" [disabled]="bankForm.invalid" (click)="nextStep()">{{ lang.get('booking.proceed') }} →</button>
          </div>
        </div>

        <!-- Step 6: Payment -->
        <div class="step-content" *ngIf="currentStep === 6">
          <h2>{{ lang.get('booking.payment') }}</h2>
          <div class="payment-options">
            <div class="payment-card" [class.selected]="paymentMode === 'bank_transfer'" (click)="paymentMode = 'bank_transfer'">
              <div class="payment-icon">🏦</div>
              <h3>{{ lang.get('booking.bankTransfer') }}</h3>
              <p>Transfer to SMC Bank Account</p>
              <div *ngIf="paymentMode === 'bank_transfer'" class="bank-info">
                <p><strong>Bank:</strong> State Bank of India</p>
                <p><strong>A/C No:</strong> 12345678901234</p>
                <p><strong>IFSC:</strong> SBIN0014523</p>
                <p><strong>Branch:</strong> Solapur Main</p>
              </div>
            </div>
            <div class="payment-card" [class.selected]="paymentMode === 'qr'" (click)="paymentMode = 'qr'">
              <div class="payment-icon">📱</div>
              <h3>{{ lang.get('booking.qrPayment') }}</h3>
              <p>Scan QR Code to Pay</p>
              <div *ngIf="paymentMode === 'qr'" class="qr-placeholder">
                <div class="qr-box">QR Code<br>Placeholder<br>🔲</div>
                <p>UPI ID: hsm&#64;ssolapurcorporation</p>
              </div>
            </div>
          </div>
          <div class="warning-box">
            ⚠️ {{ lang.get('notices.noRefresh') }}
          </div>
          <div class="error" *ngIf="submitError">{{ submitError }}</div>
          <div class="step-nav">
            <button class="btn-back" (click)="prevStep()">← {{ lang.get('booking.back') }}</button>
            <button class="btn-submit" (click)="submitBooking()" [disabled]="isSubmitting">
              {{ isSubmitting ? 'Submitting...' : lang.get('booking.submit') }}
            </button>
          </div>
        </div>

        <!-- Success -->
        <div class="step-content success-screen" *ngIf="currentStep === 7">
          <div class="success-icon">✅</div>
          <h2>Booking Submitted Successfully!</h2>
          <p>Your Booking ID: <strong>{{ bookingId }}</strong></p>
          <p *ngIf="!paymentBooking">Admin approval is required before payment. You will receive the payment link after approval.</p>
          <p *ngIf="paymentBooking">Payment completed successfully. You will receive the final booking details and receipt link by SMS.</p>
          <div class="success-actions">
            <button class="btn-outline-btn" (click)="newBooking()">Make Another Booking</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .booking-page { min-height: 100vh; background: transparent; }
    .page-header {
      background: linear-gradient(120deg, var(--ocean-deep), var(--ocean));
      color: #fff8ef; text-align: center; padding: 3rem 1rem;
    }
    .page-header h1 { margin: 0; font-size: 2rem; }
    .page-header p { margin: 0.5rem 0 0; opacity: 0.8; }

    .stepper {
      display: flex; justify-content: center; padding: 2rem 1rem;
      background: rgba(255,255,255,.7); border-bottom: 1px solid var(--line);
      flex-wrap: wrap; gap: 0.5rem;
    }
    .step { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; flex: 1; min-width: 80px; max-width: 140px; }
    .step-circle {
      width: 36px; height: 36px; border-radius: 50%;
      background: #e0e0e0; color: #999; display: flex;
      align-items: center; justify-content: center; font-weight: 700;
      font-size: 0.9rem; transition: all 0.3s;
    }
    .step.active .step-circle { background: var(--ocean); color: white; }
    .step.completed .step-circle { background: #4caf50; color: white; }
    .step-label { font-size: 0.72rem; color: #666; text-align: center; }
    .step.active .step-label { color: var(--ocean-deep); font-weight: 600; }

    .booking-body { max-width: 860px; margin: 0 auto; padding: 2rem 1.5rem; }
    .step-content h2 { color: var(--ocean-deep); margin-bottom: 1.5rem; }

    .premise-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .premise-select-card {
      border: 2px solid #e0e0e0; border-radius: 10px; padding: 1.25rem;
      cursor: pointer; transition: all 0.2s;
    }
    .premise-select-card:hover { border-color: var(--ocean); }
    .premise-select-card.selected { border-color: var(--ocean); background: linear-gradient(135deg, rgba(255,239,219,.95), rgba(229,245,250,.95)); }
    .premise-select-card h3 { margin: 0 0 0.5rem; color: var(--ocean-deep); }
    .premise-select-card .rent { color: #4caf50; font-weight: 600; }
    .premise-select-card .deposit { color: #ff6f00; font-size: 0.85rem; }

    .slot-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.75rem; }
    .slot-card {
      border: 2px solid #e0e0e0; border-radius: 8px; padding: 0.75rem;
      cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; gap: 0.3rem;
    }
    .slot-card:hover:not(.booked) { border-color: var(--ocean); }
    .slot-card.selected { border-color: var(--ocean); background: linear-gradient(135deg, rgba(255,239,219,.95), rgba(229,245,250,.95)); }
    .slot-card.booked { background: #fce4ec; border-color: #f48fb1; cursor: not-allowed; }
    .booked-label { color: #c62828; font-size: 0.75rem; font-weight: 600; }

    .summary-table { background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .summary-row {
      display: flex; justify-content: space-between; padding: 0.9rem 1.25rem;
      border-bottom: 1px solid #f0f0f0;
    }
    .summary-row.total { background: linear-gradient(120deg,var(--ocean-deep),var(--ocean)); color: white; font-size: 1.1rem; }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1rem; }
    .form-group label { font-weight: 600; font-size: 0.88rem; color: #333; }
    .form-group input, .form-group select, .form-group textarea {
      padding: 0.65rem 0.85rem; border: 1px solid #ccc; border-radius: 6px;
      font-size: 0.9rem; transition: border-color 0.2s;
    }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
      outline: none; border-color: var(--ocean);
    }
    .error { color: #c62828; font-size: 0.78rem; }

    .payment-options { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
    .payment-card {
      border: 2px solid #e0e0e0; border-radius: 12px; padding: 1.5rem;
      cursor: pointer; transition: all 0.2s; text-align: center;
    }
    .payment-card:hover { border-color: var(--ocean); }
    .payment-card.selected { border-color: var(--ocean); background: linear-gradient(135deg, rgba(255,239,219,.95), rgba(229,245,250,.95)); }
    .payment-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
    .payment-card h3 { color: var(--ocean-deep); margin-bottom: 0.5rem; }
    .bank-info, .qr-placeholder { margin-top: 1rem; text-align: left; font-size: 0.85rem; }
    .qr-box {
      width: 120px; height: 120px; border: 2px solid #ccc;
      margin: 0 auto 0.75rem; display: flex; align-items: center;
      justify-content: center; border-radius: 8px; font-size: 0.85rem; text-align: center;
    }

    .warning-box {
      background: #fff8e1; border: 1px solid #ffb300; border-radius: 6px;
      padding: 1rem; margin-bottom: 1.5rem; font-size: 0.9rem; color: #e65100;
    }

    .step-nav { display: flex; justify-content: space-between; margin-top: 2rem; }
    .btn-next, .btn-back, .btn-submit, .btn-outline-btn {
      padding: 0.75rem 2rem; border-radius: 6px; border: none;
      cursor: pointer; font-size: 0.95rem; font-weight: 600; transition: all 0.2s;
    }
    .btn-next { background: linear-gradient(135deg,var(--ocean),#0d7488); color: white; }
    .btn-next:hover:not(:disabled) { background: linear-gradient(135deg,#0d7488,var(--ocean)); }
    .btn-next:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-back { background: #f5f5f5; color: #333; border: 1px solid #ccc; }
    .btn-back:hover { background: #e0e0e0; }
    .btn-submit { background: #4caf50; color: white; }
    .btn-submit:hover:not(:disabled) { background: #388e3c; }
    .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-outline-btn { background: white; color: var(--ocean-deep); border: 2px solid var(--ocean); }

    .success-screen { text-align: center; padding: 3rem; }
    .success-icon { font-size: 4rem; margin-bottom: 1rem; }
    .success-screen h2 { color: #4caf50; }
    .success-actions { display: flex; gap: 1rem; justify-content: center; margin-top: 2rem; flex-wrap: wrap; }

    @media (max-width: 600px) {
      .form-row { grid-template-columns: 1fr; }
      .payment-options { grid-template-columns: 1fr; }
    }
  `]
})
export class BookingComponent implements OnInit {
  currentStep = 1;
  steps = ['Premise', 'Date & Slot', 'Summary', 'Applicant', 'Bank Details', 'Approval'];
  premises: Premise[] = [];
  timeSlots: TimeSlot[] = [];
  bookedSlotIds: number[] = [];
  selectedPremise: Premise | null = null;
  selectedSlot: TimeSlot | null = null;
  bookingSummary: BookingSummary | null = null;
  paymentMode: 'bank_transfer' | 'qr' | 'razorpay' = 'razorpay';
  isSubmitting = false;
  bookingId = '';
  bookingPk: number | null = null;
  paymentBooking: any = null;
  today = new Date().toISOString().split('T')[0];
  idProofFile: File | null = null;
  availabilityMessage = '';
  submitError = '';

  dateSlotForm: FormGroup;
  applicantForm: FormGroup;
  bankForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private bookingService: BookingService,
    public lang: LanguageService
  ) {
    this.dateSlotForm = this.fb.group({
      from_date: ['', Validators.required],
      to_date: ['', Validators.required]
    });

    this.applicantForm = this.fb.group({
      full_name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      mobile: ['', [Validators.required, Validators.pattern('^[6-9][0-9]{9}$')]],
      alt_mobile: [''],
      address: ['', Validators.required],
      function_name: ['', Validators.required],
      function_type: ['', Validators.required],
      expected_guests: ['', [Validators.required, Validators.min(1)]],
      id_proof_type: ['aadhaar'],
      id_proof_number: ['', Validators.required]
    });

    this.bankForm = this.fb.group({
      bank_name: ['', Validators.required],
      account_holder: ['', Validators.required],
      account_number: ['', Validators.required],
      ifsc_code: ['', [Validators.required, Validators.pattern('^[A-Z]{4}0[A-Z0-9]{6}$')]],
      branch_name: ['', Validators.required],
      micr_code: ['']
    });
  }

  ngOnInit(): void {
    this.bookingService.getPremises().subscribe({
      next: (premises) => { this.premises = premises; },
      error: () => { this.premises = []; }
    });

    this.dateSlotForm.valueChanges.subscribe(() => {
      this.refreshBookedSlotsForDateRange();
    });

    const bookingId = new URLSearchParams(window.location.search).get('bookingId');
    if (bookingId) {
      this.startApprovedPayment(bookingId);
    }
  }

  selectPremise(p: Premise): void {
    this.selectedPremise = p;
    this.selectedSlot = null;
    this.bookedSlotIds = [];
    this.bookingSummary = null;
    this.availabilityMessage = '';
    this.submitError = '';
    this.bookingService.getTimeSlots(p.id).subscribe({
      next: (slots) => {
        this.timeSlots = slots;
        this.refreshBookedSlotsForDateRange();
      },
      error: () => { this.timeSlots = []; }
    });
  }

  selectSlot(slot: TimeSlot): void {
    if (this.isSlotBooked(slot.id)) {
      this.availabilityMessage = this.getNoAvailabilityMessage();
      return;
    }
    this.selectedSlot = slot;
    this.availabilityMessage = '';
  }

  isSlotBooked(slotId: number): boolean {
    return this.bookedSlotIds.includes(slotId);
  }

  isSelectedSlotUnavailable(): boolean {
    return !!this.selectedSlot && this.isSlotBooked(this.selectedSlot.id);
  }

  loadSummary(): void {
    if (!this.selectedPremise || !this.selectedSlot) return;

    if (this.isSelectedSlotUnavailable()) {
      this.availabilityMessage = this.getNoAvailabilityMessage();
      return;
    }

    const payload = {
      premise_id: this.selectedPremise.id,
      slot_id: this.selectedSlot.id,
      from_date: this.dateSlotForm.value.from_date,
      to_date: this.dateSlotForm.value.to_date
    };
    this.bookingService.calculateSummary(payload).subscribe({
      next: (calc: any) => {
        const calculation = calc?.data ?? calc;
        this.bookingSummary = {
          premise: this.selectedPremise as Premise,
          dates: [this.dateSlotForm.value.from_date, this.dateSlotForm.value.to_date],
          slot: [this.selectedSlot as TimeSlot],
          total_days: Number(calculation?.total_days ?? 0),
          base_rent: Number(calculation?.base_rent ?? 0),
          holiday_charges: Number(calculation?.holiday_charges ?? 0),
          security_deposit: Number(calculation?.security_deposit ?? 0),
          cgst: Number(calculation?.cgst ?? 0),
          sgst: Number(calculation?.sgst ?? 0),
          total_payable: Number(calculation?.total_payable ?? 0)
        };
        this.availabilityMessage = '';
        this.nextStep();
      },
      error: (err) => {
        const apiMessage = this.extractApiMessage(err);
        this.availabilityMessage = apiMessage || this.getNoAvailabilityMessage();
        this.bookingSummary = null;
      }
    });
  }

  nextStep(): void {
    this.currentStep++;
  }

  prevStep(): void {
    this.currentStep--;
  }

  onIdProofChange(event: any): void {
    this.idProofFile = event.target.files[0] || null;
  }

  submitBooking(): void {
    if (!this.selectedPremise || !this.selectedSlot || !this.bookingSummary) return;
    if (this.applicantForm.invalid || this.bankForm.invalid) return;
    if (this.isSelectedSlotUnavailable()) {
      this.submitError = this.getNoAvailabilityMessage();
      this.currentStep = 2;
      return;
    }

    this.isSubmitting = true;
    this.submitError = '';

    const formData = new FormData();
    // ... all your existing formData.append() calls stay the same ...
    formData.append('premise', String(this.selectedPremise.id));
    formData.append('slot', String(this.selectedSlot.id));
    formData.append('from_date', this.dateSlotForm.value.from_date);
    formData.append('to_date', this.dateSlotForm.value.to_date);
    formData.append('total_days', String(this.bookingSummary.total_days));

    formData.append('full_name', this.applicantForm.value.full_name);
    formData.append('address', this.applicantForm.value.address);
    formData.append('mobile', this.applicantForm.value.mobile);
    formData.append('alt_mobile', this.applicantForm.value.alt_mobile || '');
    formData.append('email', this.applicantForm.value.email);
    formData.append('function_name', this.applicantForm.value.function_name);
    formData.append('function_type', this.applicantForm.value.function_type);
    formData.append('expected_guests', String(this.applicantForm.value.expected_guests));
    formData.append('id_proof_type', this.applicantForm.value.id_proof_type);
    formData.append('id_proof_number', this.applicantForm.value.id_proof_number);
    if (this.idProofFile) {
      formData.append('id_proof_file', this.idProofFile);
    }

    formData.append('bank_name', this.bankForm.value.bank_name);
    formData.append('account_holder', this.bankForm.value.account_holder);
    formData.append('account_number', this.bankForm.value.account_number);
    formData.append('ifsc_code', this.bankForm.value.ifsc_code);
    formData.append('branch_name', this.bankForm.value.branch_name);
    formData.append('micr_code', this.bankForm.value.micr_code || '');

    formData.append('base_rent', String(this.bookingSummary.base_rent));
    formData.append('holiday_charges', String(this.bookingSummary.holiday_charges));
    formData.append('security_deposit', String(this.bookingSummary.security_deposit));
    formData.append('cgst', String(this.bookingSummary.cgst));
    formData.append('sgst', String(this.bookingSummary.sgst));
    formData.append('total_payable', String(this.bookingSummary.total_payable));
    formData.append('payment_mode', this.paymentMode);

    this.bookingService.createBooking(formData).subscribe({
      next: (booking: any) => {
        const responseData = booking?.data ?? booking;
        this.bookingPk = responseData?.id ?? booking?.id ?? null;
        this.bookingId = responseData?.temp_booking_id ?? responseData?.booking_id ?? responseData?.bookingId ?? booking?.booking_id ?? '';
        this.isSubmitting = false;
        this.submitError = '';
        this.currentStep = 7;
      },
      error: (err) => {
        this.isSubmitting = false;
        this.submitError = this.extractApiMessage(err) || 'Booking failed. Please try again.';
      }
    });
  }

  openRazorpay(order: any): void {
    const payer = this.paymentBooking || {};
    const options: any = {
      key: order.keyId,
      amount: order.amount,
      currency: order.currency || 'INR',
      name: 'Hutatma Smruti Mandir',
      description: `Booking ID: ${this.bookingId}`,
      order_id: order.orderId,
      prefill: {
        name: this.applicantForm.value.full_name || payer.full_name || '',
        email: this.applicantForm.value.email || payer.email || '',
        contact: this.applicantForm.value.mobile || payer.mobile || ''
      },
      theme: { color: '#0d7488' },
      handler: (response: any) => {
        this.verifyAndConfirm(response);
      },
      modal: {
        ondismiss: () => {
          this.submitError = 'Payment cancelled. Please try again.';
        }
      }
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  }

  verifyAndConfirm(response: any): void {
    this.isSubmitting = true;
    const payload = {
      razorpay_order_id: response.razorpay_order_id,
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_signature: response.razorpay_signature,
      booking_id: this.bookingId,
      booking_pk: this.bookingPk
    };

    this.bookingService.verifyPayment(payload).subscribe({
      next: (result: any) => {
        this.bookingId = result?.finalBookingId || this.bookingId;
        this.isSubmitting = false;
        this.currentStep = 7; // show success screen
      },
      error: () => {
        this.isSubmitting = false;
        this.submitError = 'Payment verification failed. Contact support with Booking ID: ' + this.bookingId;
      }
    });
  }

  private startApprovedPayment(bookingId: string): void {
    this.isSubmitting = true;
    this.submitError = '';
    this.bookingService.getBookingByIdOrMobile(bookingId).subscribe({
      next: (bookings: any[]) => {
        const booking = (bookings || []).find(row =>
          row.booking_id === bookingId || row.temp_booking_id === bookingId || row.final_booking_id === bookingId
        );
        if (!booking || booking.status !== 'awaiting_payment') {
          this.isSubmitting = false;
          this.submitError = 'Booking is not approved for payment.';
          return;
        }

        this.paymentBooking = booking;
        this.bookingPk = booking.id ?? null;
        this.bookingId = booking.booking_id;
        const amountInPaise = Math.round(Number(booking.total_payable || 0) * 100);
        this.bookingService.createPaymentOrder(amountInPaise, this.bookingId).subscribe({
          next: (order: any) => {
            this.isSubmitting = false;
            this.openRazorpay(order);
          },
          error: (err) => {
            this.isSubmitting = false;
            this.submitError = this.extractApiMessage(err) || 'Failed to initiate payment. Please try again.';
          }
        });
      },
      error: (err) => {
        this.isSubmitting = false;
        this.submitError = this.extractApiMessage(err) || 'Booking not found.';
      }
    });
  }

  newBooking(): void {
    this.currentStep = 1;
    this.selectedPremise = null;
    this.selectedSlot = null;
    this.bookingSummary = null;
    this.bookingId = '';
    this.bookingPk = null;
    this.paymentBooking = null;
    this.paymentMode = 'razorpay';
    this.idProofFile = null;
    this.bookedSlotIds = [];
    this.availabilityMessage = '';
    this.submitError = '';
    this.dateSlotForm.reset();
    this.applicantForm.reset();
    this.bankForm.reset();
  }

  private refreshBookedSlotsForDateRange(): void {
    if (!this.selectedPremise) {
      this.bookedSlotIds = [];
      return;
    }

    const fromDate = this.dateSlotForm.get('from_date')?.value;
    const toDateRaw = this.dateSlotForm.get('to_date')?.value;
    if (!fromDate) {
      this.bookedSlotIds = [];
      return;
    }

    let toDate = toDateRaw || fromDate;
    if (toDate < fromDate) {
      toDate = fromDate;
      this.dateSlotForm.patchValue({ to_date: fromDate }, { emitEvent: false });
    }

    const dates = this.buildDateRange(fromDate, toDate);
    if (!dates.length) {
      this.bookedSlotIds = [];
      return;
    }

    const checks = dates.map((date) => this.bookingService.checkAvailability(this.selectedPremise!.id, date));
    forkJoin(checks).subscribe({
      next: (responses) => {
        const blocked = new Set<number>();
        responses.forEach((response) => {
          (response.booked_slots || []).forEach((slotId) => blocked.add(slotId));
        });
        this.bookedSlotIds = Array.from(blocked);

        if (this.selectedSlot && blocked.has(this.selectedSlot.id)) {
          this.selectedSlot = null;
          this.availabilityMessage = this.getNoAvailabilityMessage();
        }
      },
      error: () => {
        this.bookedSlotIds = [];
      }
    });
  }

  private buildDateRange(fromDate: string, toDate: string): string[] {
    const start = new Date(`${fromDate}T00:00:00Z`);
    const end = new Date(`${toDate}T00:00:00Z`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
      return [];
    }

    const dates: string[] = [];
    for (let current = new Date(start); current <= end; current.setUTCDate(current.getUTCDate() + 1)) {
      dates.push(current.toISOString().slice(0, 10));
    }
    return dates;
  }

  private extractApiMessage(error: any): string {
    const apiError = error?.error;
    if (!apiError) {
      return '';
    }
    if (typeof apiError === 'string') {
      return apiError;
    }
    if (apiError.error) {
      return String(apiError.error);
    }
    if (apiError.message) {
      return String(apiError.message);
    }
    if (Array.isArray(apiError.non_field_errors) && apiError.non_field_errors.length) {
      return String(apiError.non_field_errors[0]);
    }
    return '';
  }

  private getNoAvailabilityMessage(): string {
    return 'No booking available for the date & time selected. Please select another date, time & slot (session).';
  }
}
