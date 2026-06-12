import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, CommonModule, FormsModule],
  template: `
    <div class="admin-layout">
      <aside class="sidebar" [class.collapsed]="sidebarCollapsed">
        <div class="sidebar-header">
          <div class="sidebar-logo">🏛️</div>
          <div class="brand-block" *ngIf="!sidebarCollapsed">
            <div class="sidebar-title">HSM Portal</div>
            <div class="sidebar-sub">Admin Panel</div>
          </div>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/admin/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
            📊 Overview
          </a>
          <a routerLink="/admin/bookings" routerLinkActive="active">📅 Bookings</a>
          <a routerLink="/admin/premises" routerLinkActive="active">🏛️ Premises & Rates</a>
          <a routerLink="/admin/holidays" routerLinkActive="active">📆 Holidays</a>
          <a routerLink="/admin/payments" routerLinkActive="active">💳 Payments</a>
          <a routerLink="/admin/cancellations" routerLinkActive="active">❌ Cancellations</a>
          <a routerLink="/admin/complaints" routerLinkActive="active">📝 Complaints</a>
        </nav>

        <div class="sidebar-footer">
          <button class="logout-btn" (click)="auth.logout()">🚪 Logout</button>
        </div>
      </aside>

      <main class="admin-main">
        <div class="admin-topbar">
          <div class="topbar-left">
            <button type="button" class="menu-toggle" (click)="toggleSidebar()" aria-controls="sidebar" aria-expanded="false">☰</button>
            <h2>Admin Dashboard</h2>
          </div>
          <div class="admin-user">👤 {{ getDisplayName(auth.currentUser$ | async) }}</div>
        </div>

        <div class="global-search-wrap">
          <input
            type="text"
            [(ngModel)]="globalQuery"
            (keyup.enter)="runGlobalSearch()"
            placeholder="Global search across bookings, payments, cancellations, complaints..."
          />
          <button (click)="runGlobalSearch()" [disabled]="isSearching">{{ isSearching ? 'Searching...' : 'Search' }}</button>
        </div>

        <section class="search-results" *ngIf="searchTouched">
          <div class="results-title">Global Search Results</div>
          <div class="no-results" *ngIf="!isSearching && resultSections.length === 0">No results found</div>

          <div class="result-section" *ngFor="let section of resultSections">
            <div class="result-head">
              <h4>{{ section.module }} ({{ section.items.length }})</h4>
              <button class="go-btn" (click)="goTo(section.route)">Open</button>
            </div>
            <div class="result-item" *ngFor="let item of section.items.slice(0, 5)">
              {{ item }}
            </div>
          </div>
        </section>

        <div class="admin-content">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .admin-layout { display:flex; min-height:100vh; align-items:stretch; }
    .sidebar { width:240px; background:linear-gradient(180deg, rgba(250,240,224,.96), rgba(236,247,251,.96)); color:var(--ocean-deep); display:flex; flex-direction:column; flex-shrink:0; transition:width .2s ease; border:1px solid var(--line); box-shadow:0 16px 36px rgba(22,31,45,.08); margin:0; border-radius:0; }
    .sidebar.collapsed { width:72px; }
    .sidebar-header { display:flex; align-items:center; gap:.75rem; padding:1.5rem 1.25rem; border-bottom:1px solid rgba(255,255,255,.1); }
    .sidebar-logo { font-size:2rem; }
    .brand-block { overflow:hidden; }
    .sidebar-title { font-weight:700; font-size:1rem; }
    .sidebar-sub { font-size:.72rem; opacity:.7; }
    .sidebar-nav { flex:1; padding:1rem 0; }
    .sidebar-nav a { display:block; padding:.75rem 1.25rem; color:rgba(23,56,71,.84); text-decoration:none; font-size:.9rem; transition:all .2s; }
    .sidebar-nav a:hover, .sidebar-nav a.active { background:rgba(18,93,110,.1); color:var(--ocean-deep); }
    .sidebar-footer { padding:1rem 1.25rem; border-top:1px solid rgba(18,93,110,.1); }
    .logout-btn { width:100%; background:linear-gradient(135deg,var(--brand),var(--brand-deep)); color:white; border:none; padding:.6rem; border-radius:999px; cursor:pointer; font-size:.88rem; }
    .logout-btn:hover { opacity:.95; }
    .admin-main { flex:1; background:transparent; display:flex; flex-direction:column; overflow:hidden; }
    .admin-topbar { background:rgba(255,255,255,.8); padding:1rem 1.5rem; border-bottom:1px solid var(--line); display:flex; justify-content:space-between; align-items:center; }
    .topbar-left { display:flex; align-items:center; gap:.8rem; }
    .menu-toggle {
      position: relative;
      z-index: 2360; /* ensure button is above fixed sidebar */
      border:1px solid rgba(18,93,110,.2);
      background:rgba(255,255,255,.84);
      color:var(--ocean-deep);
      border-radius:6px;
      padding:.35rem .6rem;
      cursor:pointer;
      font-size:1rem;
    }
    .admin-topbar h2 { margin:0; color:var(--ocean-deep); }

    .global-search-wrap {
      background: rgba(255,255,255,.84);
      border-bottom: 1px solid var(--line);
      padding: .85rem 1.5rem;
      display: flex;
      gap: .6rem;
    }
    .global-search-wrap input {
      flex: 1;
      border: 1px solid #ccd2ef;
      border-radius: 8px;
      padding: .65rem .85rem;
      font-size: .9rem;
    }
    .global-search-wrap button {
      background: linear-gradient(135deg,var(--ocean),#0d7488);
      color: white;
      border: none;
      border-radius: 8px;
      padding: .65rem 1rem;
      cursor: pointer;
      font-weight: 600;
    }

    .search-results {
      margin: 1rem 1.5rem 0;
      padding: 1rem;
      background: #ffffff;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,.06);
    }
    .results-title { color:var(--ocean-deep); font-weight:700; margin-bottom:.8rem; }
    .no-results { color:#6c7283; font-size:.9rem; }
    .result-section { border:1px solid #eceffd; border-radius:8px; padding:.7rem .8rem; margin-bottom:.7rem; }
    .result-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:.5rem; }
    .result-head h4 { margin:0; color:var(--ocean-deep); font-size:.92rem; }
    .go-btn { border:1px solid rgba(18,93,110,.18); background:rgba(255,255,255,.84); color:var(--ocean-deep); border-radius:999px; padding:.25rem .65rem; cursor:pointer; font-size:.8rem; }
    .result-item { font-size:.82rem; color:#52586e; padding:.25rem 0; border-top:1px dashed #eef1ff; }

    .admin-content { flex:1; padding:1.5rem; overflow:auto; }

    /* Responsiveness removed — admin dashboard is desktop/web-only */
  `]
})
export class AdminDashboardComponent {
  sidebarCollapsed = false;
  globalQuery = '';
  isSearching = false;
  searchTouched = false;
  resultSections: Array<{ module: string; route: string; items: string[] }> = [];

  constructor(public auth: AuthService, private api: ApiService, private router: Router) {}

  getDisplayName(current: any): string {
    return current?.user?.name || current?.name || current?.user?.email || current?.email || '';
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  goTo(route: string): void {
    this.router.navigate([route]);
  }

  runGlobalSearch(): void {
    this.searchTouched = true;
    const q = this.globalQuery.trim().toLowerCase();
    if (!q) {
      this.resultSections = [];
      return;
    }

    this.isSearching = true;
    forkJoin({
      bookings: this.api.get<any>('bookings/'),
      payments: this.api.get<any>('payments/'),
      cancellations: this.api.get<any>('cancellations/records/'),
      complaints: this.api.get<any>('complaints/')
    }).subscribe({
      next: (res) => {
        const bookings = this.extractRows(res.bookings)
          .filter((row: any) => JSON.stringify(row).toLowerCase().includes(q))
          .map((row: any) => `${row.booking_id || row.id} • ${row.full_name || row.email || '-'}`);

        const payments = this.extractRows(res.payments)
          .filter((row: any) => JSON.stringify(row).toLowerCase().includes(q))
          .map((row: any) => `${row.booking_id || row.booking} • ${row.transaction_ref || row.status || '-'}`);

        const cancellations = this.extractRows(res.cancellations)
          .filter((row: any) => JSON.stringify(row).toLowerCase().includes(q))
          .map((row: any) => `${row.booking_id || row.booking} • ${row.status || '-'}`);

        const complaints = this.extractRows(res.complaints)
          .filter((row: any) => JSON.stringify(row).toLowerCase().includes(q))
          .map((row: any) => `${row.name || row.email || '-'} • ${row.subject || row.status || '-'}`);

        this.resultSections = [
          { module: 'Bookings', route: '/admin/bookings', items: bookings },
          { module: 'Payments', route: '/admin/payments', items: payments },
          { module: 'Cancellations', route: '/admin/cancellations', items: cancellations },
          { module: 'Complaints', route: '/admin/complaints', items: complaints }
        ].filter(section => section.items.length > 0);

        this.isSearching = false;
      },
      error: () => {
        this.resultSections = [];
        this.isSearching = false;
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
