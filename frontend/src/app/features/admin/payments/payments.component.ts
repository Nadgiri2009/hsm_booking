import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-admin-payments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="module-page">
      <div class="module-head">
        <h2>💳 Payments</h2>
        <button (click)="load()">Refresh</button>
      </div>

      <div class="toolbar">
        <input [(ngModel)]="query" (input)="applyFilter()" placeholder="Search transaction ref, booking, status..." />
      </div>

      <div class="table-wrap" *ngIf="filtered.length">
        <table>
          <thead>
            <tr>
              <th>Booking</th>
              <th>Transaction Ref</th>
              <th>Mode</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of filtered">
              <td>{{ row.booking_id || row.booking }}</td>
              <td>{{ row.transaction_ref || '-' }}</td>
              <td>{{ row.payment_mode }}</td>
              <td>₹{{ row.amount_paid }}</td>
              <td><span class="status" [class]="row.status">{{ row.status }}</span></td>
              <td>{{ row.payment_date || row.created_at }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="no-results" *ngIf="filtered.length === 0">No results found</div>
    </div>
  `,
  styles: [`
    .module-page { background:#fff; border-radius:12px; padding:1rem; box-shadow:0 2px 8px rgba(0,0,0,.06); }
    .module-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; }
    .module-head h2 { margin:0; color:var(--ocean-deep); }
    .module-head button { border:1px solid rgba(18,93,110,.18); background:rgba(255,255,255,.84); color:var(--ocean-deep); border-radius:999px; padding:.45rem .8rem; cursor:pointer; }
    .toolbar input { width:100%; border:1px solid #d6daf0; border-radius:8px; padding:.62rem .85rem; margin-bottom:1rem; }
    .table-wrap { overflow:auto; }
    table { width:100%; border-collapse:collapse; font-size:.87rem; }
    th, td { padding:.65rem; border-bottom:1px solid #eef0fb; text-align:left; }
    th { background:#f7f8ff; color:#2e3760; }
    .status { text-transform:capitalize; font-weight:700; font-size:.78rem; }
    .status.pending { color:#e65100; }
    .status.verified { color:#2e7d32; }
    .status.failed { color:#c62828; }
    .status.refunded { color:#1565c0; }
    .no-results { padding:1rem; border:1px dashed #d8dcf2; border-radius:8px; color:#5f6680; text-align:center; }
  `]
})
export class PaymentsComponent {
  rows: any[] = [];
  filtered: any[] = [];
  query = '';

  constructor(private api: ApiService) {
    this.load();
  }

  load(): void {
    this.api.get<any>('payments/').subscribe({
      next: (res) => {
        this.rows = Array.isArray(res) ? res : (res?.results || []);
        this.filtered = [...this.rows];
      },
      error: () => {
        this.rows = [];
        this.filtered = [];
      }
    });
  }

  applyFilter(): void {
    const q = this.query.trim().toLowerCase();
    this.filtered = this.rows.filter(row => JSON.stringify(row).toLowerCase().includes(q));
  }
}
