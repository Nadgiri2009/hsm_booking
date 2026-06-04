import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './payment.entity';
import { Booking } from '../bookings/booking.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Booking])],
  providers: [PaymentsService],
  exports: [PaymentsService],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
