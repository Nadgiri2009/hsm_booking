import { Controller, Post, Body, Param, Patch } from '@nestjs/common';
import { BookingsService } from './bookings.service';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Post()
  async create(@Body() body: any) {
    // Validate minimal fields in production
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
    const updated = await this.bookings.update(parseInt(id, 10), { status: 'AwaitingPayment' });
    return { success: true, booking: updated };
  }
}
