import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <div class="contact-page">
      <div class="page-header"><h1>Contact Us</h1><p>Get in touch with the Booking Office</p></div>
      <div class="contact-body">
        <div class="contact-info">
          <h3>Contact Details</h3>
          <div class="info-item" *ngFor="let item of contacts">
            <span class="info-icon">{{ item.icon }}</span>
            <div><strong>{{ item.label }}</strong><p>{{ item.value }}</p></div>
          </div>
          <div class="map-wrap">
            <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3801.5836363957687!2d75.89804871136354!3d17.669868383196466!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc5da78bc7dd5f1%3A0xf175aa31edaeaedd!2sHutatma%20Smruti%20Mandir!5e0!3m2!1sen!2sin!4v1773649170477!5m2!1sen!2sin" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
          </div>
        </div>
        <div class="contact-form">
          <h3>Send Us a Message</h3>
          <form [formGroup]="contactForm" (ngSubmit)="onSubmit()">
            <div class="form-group"><label>Name *</label><input type="text" formControlName="name" placeholder="Your name"></div>
            <div class="form-group"><label>Email *</label><input type="email" formControlName="email" placeholder="Your email"></div>
            <div class="form-group"><label>Mobile *</label><input type="tel" formControlName="mobile" placeholder="Mobile number"></div>
            <div class="form-group"><label>Subject *</label><input type="text" formControlName="subject" placeholder="Subject"></div>
            <div class="form-group"><label>Message *</label><textarea formControlName="message" rows="5" placeholder="Your message"></textarea></div>
            <div class="success-msg" *ngIf="submitted">✅ Message sent successfully.</div>
            <div class="error-msg" *ngIf="errorMsg">{{ errorMsg }}</div>
            <button type="submit" class="btn-send" [disabled]="contactForm.invalid || isSubmitting">
              {{ isSubmitting ? 'Sending...' : 'Send Message' }}
            </button>
          </form>
        </div>
      </div>
    </div>`,
  styles: [`
    .page-header { background:linear-gradient(120deg,var(--ocean-deep),var(--ocean)); color:#fff8ef; text-align:center; padding:3rem 1rem; }
    .contact-body { max-width:1100px; margin:0 auto; padding:2rem 1.5rem; display:grid; grid-template-columns:1fr 1fr; gap:2.5rem; }
    .contact-info h3, .contact-form h3 { color:var(--ocean-deep); margin-bottom:1.25rem; }
    .info-item { display:flex; gap:1rem; margin-bottom:1rem; align-items:flex-start; }
    .info-icon { font-size:1.4rem; flex-shrink:0; }
    .info-item strong { display:block; font-size:.88rem; color:#333; }
    .info-item p { margin:.2rem 0 0; font-size:.85rem; color:#666; }
    .map-wrap { margin-top:1.5rem; }
    .form-group { margin-bottom:1rem; }
    .form-group label { display:block; font-weight:600; margin-bottom:.4rem; font-size:.88rem; }
    .form-group input, .form-group textarea { width:100%; padding:.65rem; border:1px solid #ddd; border-radius:6px; font-size:.9rem; box-sizing:border-box; }
    .success-msg { background:#e8f5e9; color:#2e7d32; border:1px solid #a5d6a7; border-radius:6px; padding:.6rem .75rem; margin-bottom:.75rem; font-size:.88rem; }
    .error-msg { background:#ffebee; color:#c62828; border:1px solid #ef9a9a; border-radius:6px; padding:.6rem .75rem; margin-bottom:.75rem; font-size:.88rem; }
    .btn-send { background:linear-gradient(135deg,var(--ocean),#0d7488); color:white; border:none; padding:.75rem 2rem; border-radius:999px; font-size:.95rem; font-weight:600; cursor:pointer; width:100%; }
    .btn-send:disabled { opacity:.6; cursor:not-allowed; }
    @media(max-width:768px){ .contact-body { grid-template-columns:1fr; } }
  `]
})
export class ContactComponent {
  contactForm: FormGroup;
  submitted = false;
  isSubmitting = false;
  errorMsg = '';
  contacts = [
    { icon:'🏢', label:'Address', value:'Hutatma Smruti Mandir, Solapur – 413001, Maharashtra' },
    { icon:'📞', label:'Booking Office', value:'0217-2720100' },
    { icon:'📞', label:'Helpdesk', value:'0217-2720200' },
    { icon:'✉️', label:'Email', value:'hsm@solapurcorporation.gov.in' },
    { icon:'🕐', label:'Office Hours', value:'Mon–Sat: 10:00 AM – 5:00 PM' }
  ];
  constructor(private fb: FormBuilder, private api: ApiService) {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      mobile: ['', [Validators.required, Validators.pattern('^[6-9][0-9]{9}$')]],
      subject: ['', Validators.required],
      message: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMsg = '';
    this.submitted = false;

    this.api.post('complaints/contacts/', this.contactForm.value).subscribe({
      next: () => {
        this.submitted = true;
        this.isSubmitting = false;
        this.contactForm.reset();
      },
      error: () => {
        this.isSubmitting = false;
        this.errorMsg = 'Unable to submit your message right now. Please try again.';
      }
    });
  }
}
