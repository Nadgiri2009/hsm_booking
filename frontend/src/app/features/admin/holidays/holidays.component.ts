import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-admin-holidays',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="module-page">
      <div class="module-head">
        <h2>📆 Holidays</h2>
        <button (click)="load()">Refresh</button>
      </div>

      <div class="form-grid">
        <input type="date" [(ngModel)]="form.date" />
        <input [(ngModel)]="form.name" placeholder="Holiday name" />
        <input type="number" step="0.1" [(ngModel)]="form.charge_multiplier" placeholder="Charge multiplier" />
        <button class="save" (click)="save()">Add Holiday</button>
      </div>

      <div class="toolbar">
        <input [(ngModel)]="query" (input)="applyFilter()" placeholder="Search holiday name or date..." />
      </div>

      <div class="table-wrap" *ngIf="filtered.length">
        <table>
          <thead>
            <tr><th>Date</th><th>Name</th><th>Multiplier</th><th>Action</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of filtered">
              <td>{{ row.date }}</td>
              <td>{{ row.name }}</td>
              <td>{{ row.charge_multiplier }}</td>
              <td><button class="delete" (click)="remove(row)">Delete</button></td>
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
    .form-grid { display:grid; grid-template-columns:repeat(4,minmax(150px,1fr)); gap:.6rem; margin-bottom:.9rem; }
    .form-grid input { border:1px solid #d6daf0; border-radius:8px; padding:.62rem .85rem; }
    .save { border:none; background:linear-gradient(135deg,var(--ocean),#0d7488); color:white; border-radius:999px; cursor:pointer; }
    .toolbar input { width:100%; border:1px solid #d6daf0; border-radius:8px; padding:.62rem .85rem; margin-bottom:1rem; }
    .table-wrap { overflow:auto; }
    table { width:100%; border-collapse:collapse; font-size:.87rem; }
    th, td { padding:.65rem; border-bottom:1px solid #eef0fb; text-align:left; }
    th { background:#f7f8ff; color:#2e3760; }
    .delete { border:none; border-radius:6px; padding:.35rem .7rem; background:#c62828; color:#fff; cursor:pointer; }
    .no-results { padding:1rem; border:1px dashed #d8dcf2; border-radius:8px; color:#5f6680; text-align:center; }
    @media (max-width: 900px) { .form-grid { grid-template-columns:1fr 1fr; } }
    @media (max-width: 640px) { .form-grid { grid-template-columns:1fr; } }
  `]
})
export class HolidaysComponent {
  rows: any[] = [];
  filtered: any[] = [];
  query = '';

  form: any = {
    date: '',
    name: '',
    charge_multiplier: 1.5
  };

  constructor(private api: ApiService) {
    this.load();
  }

  load(): void {
    this.api.get<any>('premises/holidays/').subscribe({
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

  save(): void {
    this.api.post('premises/holidays/', this.form).subscribe({
      next: () => {
        this.form = { date: '', name: '', charge_multiplier: 1.5 };
        this.load();
      },
      error: () => this.load()
    });
  }

  remove(row: any): void {
    this.api.delete(`premises/holidays/${row.id}/`).subscribe({
      next: () => this.load(),
      error: () => this.load()
    });
  }
}
