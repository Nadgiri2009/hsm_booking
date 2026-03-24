import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-admin-premises',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="module-page">
      <div class="module-head">
        <h2>🏛️ Premises & Rates</h2>
        <button (click)="load()">Refresh</button>
      </div>

      <div class="form-grid">
        <input [(ngModel)]="form.name" placeholder="Premise name" />
        <input [(ngModel)]="form.capacity" type="number" placeholder="Capacity" />
        <input [(ngModel)]="form.base_rent" type="number" placeholder="Base rate" />
        <input [(ngModel)]="form.security_deposit" type="number" placeholder="Security deposit" />
      </div>
      <textarea [(ngModel)]="form.description" placeholder="Description"></textarea>
      <div class="row-actions">
        <button class="save" (click)="save()">{{ form.id ? 'Update Premise' : 'Add Premise' }}</button>
        <button class="clear" (click)="resetForm()">Clear</button>
      </div>

      <div class="toolbar">
        <input [(ngModel)]="query" (input)="applyFilter()" placeholder="Search premise name or details..." />
      </div>

      <div class="cards" *ngIf="filtered.length">
        <div class="card" *ngFor="let p of filtered">
          <h4>{{ p.name }}</h4>
          <p>{{ p.description || 'No description' }}</p>
          <div class="meta">Capacity: <strong>{{ p.capacity }}</strong></div>
          <div class="meta">Base Rate: <strong>₹{{ p.base_rent }}</strong></div>
          <div class="meta">Security Deposit: <strong>₹{{ p.security_deposit }}</strong></div>
          <div class="meta">Status: <strong>{{ p.is_active ? 'Active' : 'Inactive' }}</strong></div>
          <div class="row-actions">
            <button class="edit" (click)="edit(p)">Edit</button>
            <button class="toggle" (click)="toggleStatus(p)">{{ p.is_active ? 'Deactivate' : 'Activate' }}</button>
          </div>
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
    .form-grid { display:grid; grid-template-columns:repeat(4,minmax(160px,1fr)); gap:.6rem; margin-bottom:.6rem; }
    textarea, input { border:1px solid #d6daf0; border-radius:8px; padding:.62rem .85rem; }
    textarea { width:100%; min-height:70px; margin-bottom:.6rem; box-sizing:border-box; }
    .row-actions { display:flex; gap:.5rem; margin-bottom:1rem; }
    .row-actions button { border:none; border-radius:6px; padding:.45rem .75rem; cursor:pointer; }
    .save { background:linear-gradient(135deg,var(--ocean),#0d7488); color:white; }
    .clear { background:#eceff1; color:#37474f; }
    .toolbar input { width:100%; margin-bottom:1rem; }
    .cards { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:1rem; }
    .card { border:1px solid #e4e8fa; border-radius:10px; padding:1rem; }
    .card h4 { margin:.2rem 0 .5rem; color:var(--ocean-deep); }
    .card p { margin:.3rem 0 .7rem; color:#565f79; font-size:.85rem; }
    .meta { font-size:.82rem; color:#4b5268; margin:.2rem 0; }
    .edit { background:#00897b; color:#fff; }
    .toggle { background:#6d4c41; color:#fff; }
    .no-results { padding:1rem; border:1px dashed #d8dcf2; border-radius:8px; color:#5f6680; text-align:center; }
    @media (max-width: 1000px) { .form-grid { grid-template-columns:repeat(2,minmax(160px,1fr)); } }
    @media (max-width: 640px) { .form-grid { grid-template-columns:1fr; } }
  `]
})
export class PremisesComponent {
  rows: any[] = [];
  filtered: any[] = [];
  query = '';

  form: any = {
    id: null,
    name: '',
    description: '',
    capacity: null,
    base_rent: null,
    security_deposit: null,
    is_active: true
  };

  constructor(private api: ApiService) {
    this.load();
  }

  load(): void {
    this.api.get<any>('premises/').subscribe({
      next: (res) => {
        const list = Array.isArray(res) ? res : (res?.results || []);
        this.rows = list;
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

  edit(row: any): void {
    this.form = {
      id: row.id,
      name: row.name,
      description: row.description,
      capacity: row.capacity,
      base_rent: row.base_rent,
      security_deposit: row.security_deposit,
      is_active: row.is_active
    };
  }

  toggleStatus(row: any): void {
    this.api.patch(`premises/${row.id}/`, { is_active: !row.is_active }).subscribe({
      next: () => this.load(),
      error: () => this.load()
    });
  }

  save(): void {
    const payload = {
      name: this.form.name,
      description: this.form.description,
      capacity: Number(this.form.capacity),
      base_rent: Number(this.form.base_rent),
      security_deposit: Number(this.form.security_deposit),
      is_active: true
    };

    const req = this.form.id
      ? this.api.put(`premises/${this.form.id}/`, payload)
      : this.api.post('premises/', payload);

    req.subscribe({
      next: () => {
        this.resetForm();
        this.load();
      },
      error: () => this.load()
    });
  }

  resetForm(): void {
    this.form = {
      id: null,
      name: '',
      description: '',
      capacity: null,
      base_rent: null,
      security_deposit: null,
      is_active: true
    };
  }
}
