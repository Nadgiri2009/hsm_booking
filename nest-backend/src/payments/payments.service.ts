import { Injectable, Logger } from '@nestjs/common';
import * as Razorpay from 'razorpay';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private client: any;

  constructor() {
    const key_id = process.env.RAZORPAY_KEY_ID || '';
    const key_secret = process.env.RAZORPAY_KEY_SECRET || '';
    this.client = new (Razorpay as any)({ key_id, key_secret });
  }

  async createOrder(amountInPaise: number, currency = 'INR', receipt = 'receipt') {
    try {
      const options = {
        amount: amountInPaise,
        currency,
        receipt,
        payment_capture: 1,
      };
      const order = await this.client.orders.create(options);
      return { success: true, order };
    } catch (ex) {
      this.logger.error('createOrder failed', ex);
      return { success: false, error: String(ex) };
    }
  }

  verifyPayment(razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string) {
    try {
      const key_secret = process.env.RAZORPAY_KEY_SECRET || '';
      const generated_signature = crypto
        .createHmac('sha256', key_secret)
        .update(razorpay_order_id + '|' + razorpay_payment_id)
        .digest('hex');
      return generated_signature === razorpay_signature;
    } catch (ex) {
      this.logger.error('verifyPayment failed', ex);
      return false;
    }
  }
}
