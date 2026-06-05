import { Controller, Post, Body, Headers, Req, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './payment.entity';
import { Booking } from '../bookings/booking.entity';
import * as crypto from 'crypto';
// when @types/node isn't installed during quick edits, declare process to avoid TS errors
declare const process: any;

function hexToUint8Array(hex: string): Uint8Array {
  const len = Math.floor(hex.length / 2);
  const arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    arr[i] = parseInt(hex.substr(i * 2, 2), 16) || 0;
  }
  return arr;
}
import { SmsService } from '../common/sms.service';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);
  constructor(
    private readonly payments: PaymentsService,
    @InjectRepository(Payment)
    private readonly paymentsRepo: Repository<Payment>,
    @InjectRepository(Booking)
    private readonly bookingsRepo: Repository<Booking>,
    private readonly sms: SmsService,
  ) {}

  @Post('create-order')
  async createOrder(@Body() body: any): Promise<any> {
    const amount = body.amount;
    const currency = body.currency || 'INR';
    const receipt = body.receipt || `r_${Date.now()}`;
    const bookingId = body.bookingId;

    const result = await this.payments.createOrder(amount, currency, receipt);
    if (!result.success) return { success: false, error: result.error };

    const order: any = result.order;
    // persist payment record
    const p = this.paymentsRepo.create({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      status: 'created',
      bookingId: bookingId,
    });
    await this.paymentsRepo.save(p);

    return { success: true, order };
  }

  @Post('verify')
  async verify(@Body() body: any): Promise<any> {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return { success: false, error: 'Missing fields' };
    }

    const ok = this.payments.verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!ok) {
      this.logger.warn('Signature verification failed for order ' + razorpay_order_id);
      return { success: false, error: 'Signature verification failed' };
    }

    // update payment record
    const p = await this.paymentsRepo.findOneBy({ orderId: razorpay_order_id });
    if (p) {
      p.paymentId = razorpay_payment_id;
      p.signature = razorpay_signature;
      p.status = 'paid';
      await this.paymentsRepo.save(p);
    }

    // Update booking if present and send confirmation SMS + receipt link
    if (bookingId) {
      const booking = await this.bookingsRepo.findOneBy({ id: bookingId });
      if (booking) {
        booking.status = 'Confirmed';
        booking.paymentStatus = 'Paid';
        booking.finalBookingId = `F-${Date.now()}`;
        await this.bookingsRepo.save(booking);

        // send SMS with receipt link
        try {
          const frontend = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
          const receiptUrl = `${frontend}/receipt/${booking.finalBookingId || booking.id}`;
          const smsMsg = `Dear ${booking.fullName || 'Applicant'}, your booking is confirmed. Booking ID: ${booking.finalBookingId}. Receipt: ${receiptUrl} -SMC Solapur`;
          await this.sms.sendSms(smsMsg, String(booking.mobile));
          } catch (ex) {
          this.logger.error('Failed to send confirmation SMS', ex as any);
        }
      }
    }

    return { success: true };
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(@Req() req: any, @Headers('x-razorpay-signature') signature: string): Promise<any> {
    try {
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
      const body = req.body;
      const computed = crypto.createHmac('sha256', secret).update(JSON.stringify(body)).digest('hex');
      if (!signature || typeof signature !== 'string' || computed.length !== signature.length) {
        return { success: false, error: 'Invalid signature' };
      }
      const a = hexToUint8Array(computed);
      const b = hexToUint8Array(signature);
      const valid = crypto.timingSafeEqual(a, b);
      if (!valid) return { success: false, error: 'Invalid signature' };

      const event = body.event;
      if (event === 'payment.captured') {
        const paymentEntity = body.payload?.payment?.entity;
        const orderId = paymentEntity?.order_id;
        const paymentId = paymentEntity?.id;
        // mark payment as paid
        const p = await this.paymentsRepo.findOneBy({ orderId });
        if (p) {
          p.paymentId = paymentId;
          p.status = 'paid';
          await this.paymentsRepo.save(p);
          if (p.bookingId) {
            const booking = await this.bookingsRepo.findOneBy({ id: p.bookingId });
            if (booking) {
              booking.status = 'Confirmed';
              booking.paymentStatus = 'Paid';
              booking.finalBookingId = `F-${Date.now()}`;
              await this.bookingsRepo.save(booking);
              // send SMS with receipt link
              try {
                const frontend = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
                const receiptUrl = `${frontend}/receipt/${booking.finalBookingId || booking.id}`;
                const smsMsg = `Dear ${booking.fullName || 'Applicant'}, your booking is confirmed. Booking ID: ${booking.finalBookingId}. Receipt: ${receiptUrl} -SMC Solapur`;
                await this.sms.sendSms(smsMsg, String(booking.mobile));
              } catch (ex) {}
            }
          }
        }
      }

      return { ok: true };
    } catch (ex) {
      return { success: false, error: String(ex) };
    }
  }
}
