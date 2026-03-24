import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { BookingService } from '../../../services/booking.service';
import { PremiseService } from '../../../services/premise.service';
import { Premise, TimeSlot, BookingCalculation } from '../../../models/booking.model';

@Component({
  selector: 'app-booking-wizard',
  templateUrl: './booking-wizard.component.html',
  styleUrls: ['./booking-wizard.component.scss'],
})
export class BookingWizardComponent implements OnInit {
  isLoading = false;
  currentStep = 0;

  premises: Premise[] = [];
  timeSlots: TimeSlot[] = [];
  bookedDates: string[] = [];
  calculation: BookingCalculation | null = null;

  selectedPremise: Premise | null = null;
  selectedStartDate: Date | null = null;
  selectedEndDate: Date | null = null;
  selectedSlot: TimeSlot | null = null;

  // Forms
  premiseForm!: FormGroup;
  dateTimeForm!: FormGroup;
  applicantForm!: FormGroup;
  bankForm!: FormGroup;
  paymentForm!: FormGroup;

  idProofTypes = ['Aadhaar Card', 'PAN Card'];
  paymentModes = [
    { value: 'bank_transfer', label: 'Bank Transfer', icon: 'account_balance' },
    { value: 'qr_payment', label: 'QR Code Payment', icon: 'qr_code' },
  ];

  uploadedFile: File | null = null;
  bookingId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private bookingService: BookingService,
    private premiseService: PremiseService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadPremises();
  }

  initForms(): void {
    this.premiseForm = this.fb.group({
      premiseId: ['', Validators.required],
    });

    this.dateTimeForm = this.fb.group({
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      slotId: ['', Validators.required],
    });

    this.applicantForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      address: ['', Validators.required],
      mobile: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      altMobile: ['', Validators.pattern(/^[6-9]\d{9}$/)],
      email: ['', [Validators.required, Validators.email]],
      functionName: ['', Validators.required],
      functionType: ['', Validators.required],
      guestCount: ['', [Validators.required, Validators.min(1)]],
      details: [''],
      idProofType: ['', Validators.required],
    });

    this.bankForm = this.fb.group({
      bankName: ['', Validators.required],
      accountHolder: ['', Validators.required],
      accountNumber: ['', [Validators.required, Validators.pattern(/^\d{9,18}$/)]],
      confirmAccountNumber: ['', Validators.required],
      ifsc: ['', [Validators.required, Validators.pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)]],
      branch: ['', Validators.required],
      micr: ['', Validators.pattern(/^\d{9}$/)],
    }, { validators: this.accountNumberMatch });

    this.paymentForm = this.fb.group({
      paymentMode: ['bank_transfer', Validators.required],
      agreeTerms: [false, Validators.requiredTrue],
    });
  }

  accountNumberMatch(group: AbstractControl) {
    const ac = group.get('accountNumber')?.value;
    const cac = group.get('confirmAccountNumber')?.value;
    return ac === cac ? null : { accountMismatch: true };
  }

  loadPremises(): void {
    this.isLoading = true;
    this.premiseService.getPremises().subscribe({
      next: (data) => { this.premises = data; this.isLoading = false; },
      error: () => { this.showError('Failed to load premises'); this.isLoading = false; },
    });
  }

  onPremiseSelect(premiseId: number): void {
    this.selectedPremise = this.premises.find(p => p.id === premiseId) || null;
    if (this.selectedPremise) {
      this.loadTimeSlots(premiseId);
      this.loadBookedDates(premiseId);
    }
  }

  loadTimeSlots(premiseId: number): void {
    this.premiseService.getTimeSlots(premiseId).subscribe({
      next: (slots) => { this.timeSlots = slots; },
      error: () => this.showError('Failed to load time slots'),
    });
  }

  loadBookedDates(premiseId: number): void {
    this.bookingService.getBookedDates(premiseId).subscribe({
      next: (dates) => { this.bookedDates = dates; },
    });
  }

  isDateBooked = (d: Date | null): boolean => {
    if (!d || !this.selectedSlot) return false;
    const dateStr = d.toISOString().split('T')[0];
    return this.bookedDates.includes(dateStr + '_' + this.selectedSlot.id);
  };

  onDateChange(): void {
    const { startDate, endDate, slotId } = this.dateTimeForm.value;
    if (startDate && endDate && slotId) {
      this.selectedSlot = this.timeSlots.find(s => s.id === slotId) || null;
      this.calculateBooking();
    }
  }

  calculateBooking(): void {
    const { startDate, endDate, slotId } = this.dateTimeForm.value;
    if (!startDate || !endDate || !slotId || !this.selectedPremise) return;

    this.bookingService.calculateBooking({
      premiseId: this.selectedPremise.id,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      slotId,
    }).subscribe({
      next: (calc) => { this.calculation = calc; },
      error: () => this.showError('Calculation failed'),
    });
  }

  onFileUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.uploadedFile = input.files[0];
    }
  }

  nextStep(): void {
    if (this.currentStep < 5) this.currentStep++;
  }

  prevStep(): void {
    if (this.currentStep > 0) this.currentStep--;
  }

  isStepValid(): boolean {
    switch (this.currentStep) {
      case 0: return this.premiseForm.valid;
      case 1: return this.dateTimeForm.valid;
      case 2: return true; // Summary read-only
      case 3: return this.applicantForm.valid && !!this.uploadedFile;
      case 4: return this.bankForm.valid;
      case 5: return this.paymentForm.valid;
      default: return false;
    }
  }

  submitBooking(): void {
    if (!this.isStepValid()) return;
    this.isLoading = true;

    const payload = {
      premiseId: this.premiseForm.value.premiseId,
      startDate: this.dateTimeForm.value.startDate.toISOString().split('T')[0],
      endDate: this.dateTimeForm.value.endDate.toISOString().split('T')[0],
      slotId: this.dateTimeForm.value.slotId,
      applicant: this.applicantForm.value,
      bankDetails: this.bankForm.value,
      paymentMode: this.paymentForm.value.paymentMode,
    };

    this.bookingService.createBooking(payload).subscribe({
      next: (res) => {
        this.bookingId = res.bookingId;
        this.isLoading = false;
        this.currentStep = 6; // Success step
      },
      error: (err) => {
        this.showError(err.error?.message || 'Booking failed. Please try again.');
        this.isLoading = false;
      },
    });
  }

  printReceipt(): void {
    if (this.bookingId) {
      this.router.navigate(['/print-booking'], { queryParams: { id: this.bookingId } });
    }
  }

  private showError(msg: string): void {
    console.error(msg);
    window.alert(msg);
  }
}
