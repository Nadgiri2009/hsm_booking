import { Controller, Post, Body, Param, Patch, Logger } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { SmsService } from '../common/sms.service';
import { PaymentsService } from '../payments/payments.service';

@Controller('bookings')
export class BookingsController {
  private readonly logger = new Logger(BookingsController.name);
  constructor(
    private readonly bookings: BookingsService,
    private readonly sms: SmsService,
    private readonly payments: PaymentsService,
  ) {}

  @Post()
  async create(@Body() body: any) {
    const created = await this.bookings.create({
      tempBookingId: body.tempBookingId || `T-${Date.now()}`,
      status: 'PendingApproval',
      paymentStatus: 'Pending',
      totalPayable: body.totalPayable || 0,
      mobile: body.mobile,
      fullName: body.fullName,
    });
    return { success: true, booking: created };
  }

  @Patch(':id/approve')
  async approve(@Param('id') id: string) {
    const bookingId = parseInt(id, 10);
    const booking = await this.bookings.findOne(bookingId);
    if (!booking) return { success: false, error: 'Booking not found' };

    // move to awaiting payment
    await this.bookings.update(bookingId, { status: 'AwaitingPayment' });

    // create razorpay order (amount in paise)
    const amountPaise = Math.round(Number(booking.totalPayable || 0) * 100);
    const receipt = booking.tempBookingId || `r_${Date.now()}`;
    const orderRes = await this.payments.createOrder(amountPaise, 'INR', receipt);
    if (!orderRes.success) {
      this.logger.error('Failed to create order for booking ' + bookingId);
      return { success: false, error: orderRes.error };
    }

    const order = orderRes.order;

    // compose payment link — frontend will open checkout using order id
    const frontend = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
    const paymentUrl = `${frontend}/book?orderId=${order.id}&bookingId=${bookingId}`;

    const smsMsg = `Dear ${booking.fullName || 'Applicant'}, your booking is approved. Pay at: ${paymentUrl} Amount: Rs.${(amountPaise/100).toFixed(2)}. -SMC Solapur`;

    if (booking.mobile) {
      try {
        const smsRes = await this.sms.sendSms(smsMsg, String(booking.mobile));
        this.logger.log('Payment link SMS sent: ' + JSON.stringify(smsRes));
      } catch (ex) {
        this.logger.error('Failed to send SMS', ex as any);
      }
    }

    return { success: true, order, booking };
  }
}
