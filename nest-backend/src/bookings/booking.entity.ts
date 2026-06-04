import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'bookings' })
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  tempBookingId?: string;

  @Column({ nullable: true })
  finalBookingId?: string;

  @Column({ default: 'Draft' })
  status: string;

  @Column({ default: 'Pending' })
  paymentStatus: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalPayable: number;

  @Column({ nullable: true })
  mobile?: string;

  @Column({ nullable: true })
  fullName?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
