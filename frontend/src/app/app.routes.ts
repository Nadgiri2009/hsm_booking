import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  {
    path: 'home',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'about',
    loadComponent: () => import('./features/about/about.component').then(m => m.AboutComponent)
  },
  {
    path: 'booking',
    loadComponent: () => import('./features/booking/booking.component').then(m => m.BookingComponent)
  },
  {
    path: 'print-booking',
    loadComponent: () => import('./features/print-booking/print-booking.component').then(m => m.PrintBookingComponent)
  },
  {
    path: 'gallery',
    loadComponent: () => import('./features/gallery/gallery.component').then(m => m.GalleryComponent)
  },
  {
    path: 'contact',
    loadComponent: () => import('./features/contact/contact.component').then(m => m.ContactComponent)
  },
  {
    path: 'admin/login',
    loadComponent: () => import('./features/admin/login/admin-login.component').then(m => m.AdminLoginComponent)
  },
  {
    path: 'admin',
    canActivate: [AuthGuard],
    loadComponent: () => import('./features/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/overview/overview.component').then(m => m.OverviewComponent)
      },
      {
        path: 'premises',
        loadComponent: () => import('./features/admin/premises/premises.component').then(m => m.PremisesComponent)
      },
      {
        path: 'bookings',
        loadComponent: () => import('./features/admin/bookings/bookings.component').then(m => m.BookingsComponent)
      },
      {
        path: 'holidays',
        loadComponent: () => import('./features/admin/holidays/holidays.component').then(m => m.HolidaysComponent)
      },
      {
        path: 'cancellations',
        loadComponent: () => import('./features/admin/cancellations/cancellations.component').then(m => m.CancellationsComponent)
      },
      {
        path: 'payments',
        loadComponent: () => import('./features/admin/payments/payments.component').then(m => m.PaymentsComponent)
      },
      {
        path: 'complaints',
        loadComponent: () => import('./features/admin/complaints/complaints.component').then(m => m.ComplaintsComponent)
      }
    ]
  },
  { path: '**', redirectTo: 'home' }
];
