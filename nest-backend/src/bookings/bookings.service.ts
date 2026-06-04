import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Booking } from './booking.entity';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly repo: Repository<Booking>,
  ) {}

  async create(payload: Partial<Booking>) {
    const b = this.repo.create(payload as Booking);
    return this.repo.save(b);
  }

  async findOne(id: number) {
    return this.repo.findOneBy({ id });
  }

  async update(id: number, patch: Partial<Booking>) {
    await this.repo.update(id, patch);
    return this.findOne(id);
  }
}
