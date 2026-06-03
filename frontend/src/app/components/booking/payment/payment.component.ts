import { Component } from '@angular/core';
import { PaymentService } from '../../../services/payment.service';

declare var Razorpay: any;

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
})
export class PaymentComponent {
  amount = 0; // in rupees
  loading = false;
  message = '';

  constructor(private paymentService: PaymentService) {}

  pay() {
    this.message = '';
    if (!this.amount || this.amount <= 0) {
      this.message = 'Enter a valid amount';
      return;
    }

    const amountPaise = Math.round(this.amount * 100);
    this.loading = true;

    this.paymentService.createOrder({ amount: amountPaise }).subscribe({
      next: (res) => {
        const options = {
          key: res.keyId,
          amount: res.amount,
          currency: res.currency,
          name: 'HSM Booking',
          order_id: res.orderId,
          handler: (response: any) => {
            // verify payment on server
            this.paymentService
              .verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              })
              .subscribe({
                next: (verifyRes) => {
                  this.loading = false;
                  if (verifyRes.success) {
                    this.message = 'Payment verified successfully';
                  } else {
                    this.message = 'Verification failed';
                  }
                },
                error: (err) => {
                  this.loading = false;
                  this.message = err?.error?.error || 'Verification error';
                },
              });
          },
          modal: {
            ondismiss: () => {
              this.loading = false;
              this.message = 'Payment popup closed';
            },
          },
        };

        const rzp = new Razorpay(options);
        rzp.open();
      },
      error: (err) => {
        this.loading = false;
        this.message = err?.error?.error || 'Error creating order';
      },
    });
  }
}
