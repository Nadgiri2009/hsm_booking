import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-admin-complaints',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="module-page">
      <div class="module-head">
        <h2>📝 Complaints</h2>
        <button (click)="load()">Refresh</button>
      </div>

      <div class="toolbar">
        <input [(ngModel)]="query" (input)="applyFilter()" placeholder="Search complainant, subject, booking id, status..." />
      </div>

      <div class="table-wrap" *ngIf="filtered.length">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Booking</th>
              <th>Subject</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of paginatedRows">
              <td>{{ row.name }}</td>
              <td>{{ row.booking_id || '-' }}</td>
              <td>{{ row.subject }}</td>
              <td><span class="status" [class]="row.status">{{ row.status }}</span></td>
              <td>
                <select [ngModel]="row.status" (ngModelChange)="updateStatus(row, $event)">
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination" *ngIf="filtered.length > pageSize">
        <div class="page-info">
          Showing {{ startItem }}-{{ endItem }} of {{ filtered.length }} complaints
        </div>
        <div class="page-actions">
          <button (click)="goToPrevPage()" [disabled]="currentPage === 1">Previous</button>
          <span>Page {{ currentPage }} of {{ totalPages }}</span>
          <button (click)="goToNextPage()" [disabled]="currentPage === totalPages">Next</button>
        </div>
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
    select { border:1px solid #d6daf0; border-radius:6px; padding:.32rem .5rem; font-size:.82rem; }
    .status { text-transform:capitalize; font-weight:700; font-size:.78rem; }
    .status.open { color:#c62828; }
    .status.in_progress { color:#e65100; }
    .status.resolved { color:#2e7d32; }
    .status.closed { color:#1565c0; }
    .no-results { padding:1rem; border:1px dashed #d8dcf2; border-radius:8px; color:#5f6680; text-align:center; }
    .pagination { display:flex; justify-content:space-between; align-items:center; gap:.8rem; margin-top:.9rem; flex-wrap:wrap; }
    .page-info { font-size:.84rem; color:#5f6680; }
    .page-actions { display:flex; align-items:center; gap:.55rem; font-size:.84rem; color:#2e3760; }
    .page-actions button { border:1px solid rgba(18,93,110,.18); background:rgba(255,255,255,.84); color:var(--ocean-deep); border-radius:999px; padding:.35rem .7rem; cursor:pointer; font-size:.8rem; }
    .page-actions button:disabled { opacity:.5; cursor:not-allowed; }
  `]
})
export class ComplaintsComponent {
  rows: any[] = [];
  filtered: any[] = [];
  readonly pageSize = 10;
  currentPage = 1;
  query = '';

  constructor(private api: ApiService) {
    this.load();
  }

  load(): void {
    this.api.get<any>('complaints/').subscribe({
      next: (res) => {
        this.rows = Array.isArray(res) ? res : (res?.results || []);
        this.filtered = [...this.rows];
        this.currentPage = 1;
      },
      error: () => {
        this.rows = [];
        this.filtered = [];
        this.currentPage = 1;
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

  updateStatus(row: any, status: string): void {
    this.api.patch(`complaints/${row.id}/`, { status }).subscribe({
      next: () => this.load(),
      error: () => this.load()
    });
  }
}
