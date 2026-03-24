import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BookingService } from '../../services/booking.service';
import { Booking } from '../../models/booking.model';

@Component({
  selector: 'app-print-booking',
  templateUrl: './print-booking.component.html',
  styleUrls: ['./print-booking.component.scss'],
})
export class PrintBookingComponent implements OnInit {
  searchForm!: FormGroup;
  booking: Booking | null = null;
  isLoading = false;
  error = '';
  searched = false;

  constructor(
    private fb: FormBuilder,
    private bookingService: BookingService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.searchForm = this.fb.group({
      query: ['', [Validators.required, Validators.minLength(3)]],
    });

    // Auto-search if ID passed in query params
    this.route.queryParams.subscribe((params) => {
      if (params['id']) {
        this.searchForm.patchValue({ query: params['id'] });
        this.search();
      }
    });
  }

  search(): void {
    if (this.searchForm.invalid) return;
    this.isLoading = true;
    this.error = '';
    this.booking = null;
    this.searched = true;

    this.bookingService.getBookingByIdOrMobile(this.searchForm.value.query).subscribe({
      next: (data) => { this.booking = data; this.isLoading = false; },
      error: (err) => {
        this.error = err.status === 404 ? 'No booking found with this ID/Mobile.' : 'Failed to fetch booking. Try again.';
        this.isLoading = false;
      },
    });
  }

  downloadPDF(): void {
    if (!this.booking) return;
    this.bookingService.downloadReceipt(this.booking.bookingId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Receipt_${this.booking!.bookingId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
    });
  }

  printReceipt(): void {
    window.print();
  }
}
