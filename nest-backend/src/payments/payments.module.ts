import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './payment.entity';
import { Booking } from '../bookings/booking.entity';
import { SmsService } from '../common/sms.service';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Booking])],
  providers: [PaymentsService, SmsService],
  exports: [PaymentsService, SmsService],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
