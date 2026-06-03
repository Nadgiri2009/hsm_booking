import { Component } from '@angular/core';
import { SmsService, SmsPayload } from './sms.service';

@Component({
  selector: 'app-sms',
  templateUrl: './sms.component.html',
})
export class SmsComponent {
  mobileNo = '';
  smsMsg = '';
  dltTeId = '';

  loading = false;
  successMsg = '';
  errorMsg = '';

  constructor(private smsService: SmsService) {}

  sendSms() {
    this.successMsg = '';
    this.errorMsg = '';
    if (!this.mobileNo || !this.smsMsg) {
      this.errorMsg = 'Mobile number and message are required';
      return;
    }

    const payload: SmsPayload = {
      mobileNo: this.mobileNo,
      smsMsg: this.smsMsg,
      dltTeId: this.dltTeId || undefined,
    };

    this.loading = true;
    this.smsService.sendSms(payload).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.status === 'success') {
          this.successMsg = 'SMS sent successfully';
          this.smsMsg = '';
        } else {
          this.errorMsg = res.error || 'Unknown error from server';
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.error || err.message || 'Network error';
      },
    });
  }
}
