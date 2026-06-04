import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-admin-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="module-page">
      <div class="module-head">
        <h2>📅 Bookings</h2>
        <button (click)="load()">Refresh</button>
      </div>

      <div class="toolbar">
        <input [(ngModel)]="query" (input)="applyFilter()" placeholder="Search booking id, applicant, mobile, status..." />
      </div>

      <div class="no-results" *ngIf="!loading && filtered.length === 0">No results found</div>

      <div class="table-wrap" *ngIf="filtered.length">
        <table>
          <thead>
            <tr>
              <th>Sr. No.</th>
              <th>Booking ID</th>
              <th>Applicant</th>
              <th>Premise</th>
              <th>Dates</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of paginatedRows; let index = index">
              <td>{{ getSerialNumber(index) }}</td>
              <td>{{ row.booking_id }}</td>
              <td>{{ row.full_name || '-' }}</td>
              <td>{{ row.premise_name || '-' }}</td>
              <td>{{ row.from_date }} → {{ row.to_date }}</td>
              <td><span class="status" [class]="row.status">{{ row.status }}</span></td>
              <td class="actions">
                <button class="approve" (click)="approve(row)" [disabled]="!canReview(row)">Approve</button>
                <button class="reject" (click)="reject(row)" [disabled]="!canReview(row)">Reject</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination" *ngIf="filtered.length > pageSize">
        <div class="page-info">
          Showing {{ startItem }}-{{ endItem }} of {{ filtered.length }} bookings
        </div>
        <div class="page-actions">
          <button (click)="goToPrevPage()" [disabled]="currentPage === 1">Previous</button>
          <span>Page {{ currentPage }} of {{ totalPages }}</span>
          <button (click)="goToNextPage()" [disabled]="currentPage === totalPages">Next</button>
        </div>
      </div>
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
    .status.pending, .status.pending_approval, .status.awaiting_payment { color:#e65100; }
    .status.approved, .status.confirmed { color:#2e7d32; }
    .status.rejected, .status.cancelled { color:#c62828; }
    .actions { display:flex; gap:.45rem; }
    .actions button { border:none; border-radius:6px; padding:.35rem .65rem; cursor:pointer; font-size:.78rem; }
    .actions .approve { background:#2e7d32; color:#fff; }
    .actions .reject { background:#c62828; color:#fff; }
    .actions button:disabled { opacity:.5; cursor:not-allowed; }
    .no-results { padding:1rem; border:1px dashed #d8dcf2; border-radius:8px; color:#5f6680; text-align:center; }
    .pagination { display:flex; justify-content:space-between; align-items:center; gap:.8rem; margin-top:.9rem; flex-wrap:wrap; }
    .page-info { font-size:.84rem; color:#5f6680; }
    .page-actions { display:flex; align-items:center; gap:.55rem; font-size:.84rem; color:#2e3760; }
    .page-actions button {
      border:1px solid rgba(18,93,110,.18);
      background:rgba(255,255,255,.84);
      color:var(--ocean-deep);
      border-radius:999px;
      padding:.35rem .7rem;
      cursor:pointer;
      font-size:.8rem;
    }
    .page-actions button:disabled { opacity:.5; cursor:not-allowed; }
  `]
})
export class BookingsComponent {
  rows: any[] = [];
  filtered: any[] = [];
  readonly pageSize = 10;
  currentPage = 1;
  query = '';
  loading = false;

  constructor(private api: ApiService) {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api.get<any>('bookings/').subscribe({
      next: (res) => {
        this.rows = this.extractRows(res);
        this.filtered = [...this.rows];
        this.currentPage = 1;
        this.loading = false;
      },
      error: () => {
        this.rows = [];
        this.filtered = [];
        this.currentPage = 1;
        this.loading = false;
      }
    });
  }

  applyFilter(): void {
    const q = this.query.trim().toLowerCase();
    this.filtered = this.rows.filter(row => JSON.stringify(row).toLowerCase().includes(q));
    this.currentPage = 1;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filtered.length / this.pageSize));
  }

  get paginatedRows(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  get startItem(): number {
    if (this.filtered.length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.pageSize, this.filtered.length);
  }

  getSerialNumber(index: number): number {
    return (this.currentPage - 1) * this.pageSize + index + 1;
  }

  goToPrevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  approve(row: any): void {
    this.api.post(`bookings/${row.id}/approve/`, {}).subscribe({
      next: () => this.load(),
      error: () => this.load()
    });
  }

  reject(row: any): void {
    const reason = window.prompt('Enter rejection reason');
    if (!reason) return;
    this.api.post(`bookings/${row.id}/reject/`, { reason }).subscribe({
      next: () => this.load(),
      error: () => this.load()
    });
  }

  canReview(row: any): boolean {
    return row.status === 'pending_approval' || row.status === 'pending';
  }

  private extractRows(source: any): any[] {
    if (Array.isArray(source)) return source;
    if (Array.isArray(source?.results)) return source.results;
    if (Array.isArray(source?.data)) return source.data;
    return [];
  }
}
