import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'payments' })
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true, unique: true })
  orderId?: string;

  @Column({ nullable: true })
  paymentId?: string;

  @Column({ nullable: true })
  signature?: string;

  @Column({ type: 'int', default: 0 })
  amount: number;

  @Column({ default: 'INR' })
  currency: string;

  @Column({ default: 'created' })
  status: string;

  @Column({ nullable: true })
  bookingId?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
