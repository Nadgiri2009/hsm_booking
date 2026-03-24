import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
})
export class AdminDashboardComponent implements OnInit {
  stats: any = {};
  isLoading = true;

  statsCards = [
    { key: 'totalBookings', label: 'Total Bookings', icon: 'event', color: '#1a4b8c', route: '/admin/bookings' },
    { key: 'totalRevenue', label: 'Total Revenue (₹)', icon: 'payments', color: '#2e7d32', route: null },
    { key: 'pendingBookings', label: 'Pending Approvals', icon: 'pending_actions', color: '#f57c00', route: '/admin/bookings' },
    { key: 'totalCancellations', label: 'Cancellations', icon: 'cancel', color: '#c62828', route: '/admin/cancellations' },
    { key: 'totalComplaints', label: 'Complaints', icon: 'report_problem', color: '#6a1b9a', route: '/admin/complaints' },
    { key: 'monthlyRevenue', label: 'Monthly Revenue (₹)', icon: 'bar_chart', color: '#00695c', route: null },
  ];

  managementCards = [
    { label: 'Manage Premises & Rent', icon: 'apartment', route: '/admin/premises', color: '#1a4b8c', desc: 'Add/edit premises, rates & time slots' },
    { label: 'Manage Holidays', icon: 'event_busy', route: '/admin/holidays', color: '#e65100', desc: 'Set holiday dates & charge multipliers' },
    { label: 'Cancelled Bookings', icon: 'cancel', route: '/admin/cancellations', color: '#c62828', desc: 'Review & process refund requests' },
    { label: 'Print Receipt', icon: 'print', route: '/admin/bookings', color: '#2e7d32', desc: 'Generate & print booking receipts' },
    { label: 'Migration Records', icon: 'swap_horiz', route: '/admin/bookings', color: '#6a1b9a', desc: 'View partial & migrated records' },
    { label: 'Approved Bookings', icon: 'check_circle', route: '/admin/bookings', color: '#00695c', desc: 'All confirmed venue bookings' },
  ];

  recentBookings: any[] = [];
  displayedColumns = ['bookingId', 'applicant', 'premise', 'dates', 'amount', 'status', 'actions'];

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.notificationService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.recentBookings = data.recentBookings || [];
        this.isLoading = false;
      },
      error: () => {
        // Mock data for development
        this.stats = {
          totalBookings: 248,
          totalRevenue: 1850000,
          pendingBookings: 12,
          totalCancellations: 18,
          totalComplaints: 5,
          monthlyRevenue: 125000,
        };
        this.recentBookings = [];
        this.isLoading = false;
      },
    });
  }

  formatCurrency(val: number): string {
    return new Intl.NumberFormat('en-IN').format(val);
  }

  getStatValue(key: string): string {
    const val = this.stats[key];
    if (!val) return '0';
    if (key.toLowerCase().includes('revenue')) return '₹' + this.formatCurrency(val);
    return val.toString();
  }
}
