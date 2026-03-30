import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-overview">
      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card" *ngFor="let s of stats">
          <div class="stat-icon">{{ s.icon }}</div>
          <div class="stat-info">
            <div class="stat-value">{{ s.value }}</div>
            <div class="stat-label">{{ s.label }}</div>
          </div>
        </div>
      </div>

      <!-- Quick Action Cards -->
      <div class="action-cards">
        <div class="section-title">Quick Actions</div>
        <div class="actions-grid">
          <div class="action-card" *ngFor="let a of actions" (click)="navigate(a.route)">
            <div class="action-icon">{{ a.icon }}</div>
            <div class="action-label">{{ a.label }}</div>
          </div>
        </div>
      </div>

      <!-- Recent Bookings Table -->
      <div class="table-section">
        <div class="table-header">
          <h3>Recent Bookings</h3>
          <input type="text" placeholder="Search..." class="search-input" (input)="filterTable($event)">
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Sr. No.</th><th>Booking ID</th><th>Applicant</th><th>Premise</th>
                <th>Date</th><th>Amount</th><th>Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let b of filteredBookings; let i = index">
                <td>{{ i + 1 }}</td>
                <td>{{ b.booking_id }}</td>
                <td>{{ b.name }}</td>
                <td>{{ b.premise }}</td>
                <td>{{ b.date }}</td>
                <td>₹{{ b.amount | number }}</td>
                <td><span class="badge" [class]="b.status">{{ b.status }}</span></td>
                <td><button class="btn-view" (click)="viewDetail(b)">View</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-overview { display:flex; flex-direction:column; gap:1.5rem; width:100%; }
    .stats-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:1rem; }
    .stat-card {
      background:white; border-radius:12px; padding:1.25rem;
      display:flex; align-items:center; gap:1rem;
      box-shadow:0 2px 8px rgba(0,0,0,.06); border-left:4px solid var(--ocean);
    }
    .stat-icon { font-size:2rem; }
    .stat-value { font-size:1.5rem; font-weight:700; color:var(--ocean-deep); }
    .stat-label { font-size:.8rem; color:#666; }
    .action-cards { background:white; border-radius:12px; padding:1.25rem; box-shadow:0 2px 8px rgba(0,0,0,.06); }
    .section-title { font-weight:700; color:var(--ocean-deep); margin-bottom:1rem; }
    .actions-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(130px,1fr)); gap:1rem; }
    .action-card {
      border:1px solid #e0e0e0; border-radius:10px; padding:1.25rem .75rem;
      text-align:center; cursor:pointer; transition:all .2s;
    }
    .action-card:hover { border-color:var(--ocean); background:linear-gradient(135deg, rgba(255,239,219,.95), rgba(229,245,250,.95)); }
    .action-icon { font-size:1.75rem; margin-bottom:.5rem; }
    .action-label { font-size:.8rem; color:#333; font-weight:600; }
    .table-section { background:white; border-radius:12px; padding:1.25rem; box-shadow:0 2px 8px rgba(0,0,0,.06); }
    .table-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; }
    .table-header h3 { margin:0; color:var(--ocean-deep); }
    .search-input { padding:.5rem .85rem; border:1px solid #ccc; border-radius:6px; font-size:.88rem; width:240px; }
    .table-wrap { overflow-x:auto; }
    table { width:100%; border-collapse:collapse; font-size:.88rem; }
    th { background:#f5f5f5; padding:.75rem; text-align:left; font-weight:600; color:#333; border-bottom:2px solid #e0e0e0; }
    td { padding:.75rem; border-bottom:1px solid #f0f0f0; }
    tr:hover td { background:#f9f9f9; }
    .badge { padding:.25rem .65rem; border-radius:20px; font-size:.75rem; font-weight:600; }
    .badge.approved { background:#e8f5e9; color:#2e7d32; }
    .badge.pending { background:#fff3e0; color:#e65100; }
    .badge.cancelled { background:#fce4ec; color:#c62828; }
    .badge.rejected { background:#f3e5f5; color:#6a1b9a; }
    .btn-view { background:linear-gradient(135deg,var(--ocean),#0d7488); color:white; border:none; padding:.35rem .85rem; border-radius:999px; cursor:pointer; font-size:.8rem; }
  `]
})
export class OverviewComponent implements OnInit {
  stats = [
    { icon: '📅', label: 'Total Bookings', value: '247' },
    { icon: '💳', label: 'Total Payments', value: '₹18.4L' },
    { icon: '📈', label: 'Revenue (MTD)', value: '₹3.2L' },
    { icon: '📝', label: 'Complaints', value: '12' },
    { icon: '❌', label: 'Cancellations', value: '28' }
  ];

  actions = [
    { icon: '🏛️', label: 'Manage Premises', route: '/admin/premises' },
    { icon: '💰', label: 'Rent & Rates', route: '/admin/premises' },
    { icon: '📆', label: 'Holidays', route: '/admin/holidays' },
    { icon: '❌', label: 'Cancellations', route: '/admin/cancellations' },
    { icon: '🧾', label: 'Print Receipt', route: '/admin/bookings' },
    { icon: '📋', label: 'Approved Bookings', route: '/admin/bookings' }
  ];

  bookings = [
    { booking_id: 'HSM20240001', name: 'Rajesh Kumar', premise: 'Main Hall', date: '2024-02-10', amount: 52000, status: 'approved' },
    { booking_id: 'HSM20240002', name: 'Priya Sharma', premise: 'VIP Room', date: '2024-02-12', amount: 16200, status: 'pending' },
    { booking_id: 'HSM20240003', name: 'Suresh Patil', premise: 'Dining Hall', date: '2024-02-14', amount: 27800, status: 'approved' },
    { booking_id: 'HSM20240004', name: 'Meena Joshi', premise: 'Art Gallery', date: '2024-02-15', amount: 19600, status: 'cancelled' }
  ];
  filteredBookings = [...this.bookings];

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  filterTable(event: any): void {
    const q = event.target.value.toLowerCase();
    this.filteredBookings = this.bookings.filter(b =>
      b.booking_id.toLowerCase().includes(q) || b.name.toLowerCase().includes(q) || b.premise.toLowerCase().includes(q)
    );
  }

  navigate(route: string): void {
    this.router.navigate([route]);
  }

  viewDetail(b: any): void {
    this.router.navigate(['/admin/bookings']);
  }

  private loadDashboardData(): void {
    forkJoin({
      bookings: this.api.get<any>('bookings/'),
      payments: this.api.get<any>('payments/'),
      complaints: this.api.get<any>('complaints/'),
      cancellations: this.api.get<any>('cancellations/records/')
    }).subscribe({
      next: ({ bookings, payments, complaints, cancellations }) => {
        const bookingRows = this.extractRows(bookings);
        const paymentRows = this.extractRows(payments);
        const complaintRows = this.extractRows(complaints);
        const cancellationRows = this.extractRows(cancellations);

        this.stats = [
          { icon: '📅', label: 'Total Bookings', value: String(bookingRows.length) },
          { icon: '💳', label: 'Total Payments', value: String(paymentRows.length) },
          {
            icon: '📈',
            label: 'Revenue',
            value: `₹${paymentRows.reduce((sum: number, p: any) => sum + Number(p.amount_paid || 0), 0).toLocaleString('en-IN')}`
          },
          { icon: '📝', label: 'Complaints', value: String(complaintRows.length) },
          { icon: '❌', label: 'Cancellations', value: String(cancellationRows.length) }
        ];

        this.bookings = bookingRows.slice(0, 8).map((row: any) => ({
          booking_id: row.booking_id,
          name: row.full_name || '-',
          premise: row.premise_name || '-',
          date: `${row.from_date || '-'} to ${row.to_date || '-'}`,
          amount: Number(row.total_payable || 0),
          status: row.status || 'pending'
        }));
        this.filteredBookings = [...this.bookings];
      }
    });
  }

  private extractRows(source: any): any[] {
    if (Array.isArray(source)) return source;
    if (Array.isArray(source?.results)) return source.results;
    if (Array.isArray(source?.data)) return source.data;
    return [];
  }
}
