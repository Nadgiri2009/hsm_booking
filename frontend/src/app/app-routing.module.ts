import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './components/home/home.component';
// NOTE: some pages (About/Gallery/Contact) are not present in this build.
// Routes for those pages are redirected to home to avoid missing imports.
import { AdminLoginComponent } from './components/admin/admin-login/admin-login.component';
import { AdminDashboardComponent } from './components/admin/admin-dashboard/admin-dashboard.component';
// Admin sub-pages not present in this lightweight frontend snapshot.
// Keep only dashboard; other admin routes redirect to dashboard.
import { BookingWizardComponent } from './components/booking/booking-wizard/booking-wizard.component';
import { PrintBookingComponent } from './components/print-booking/print-booking.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'about', redirectTo: '' },
  { path: 'gallery', redirectTo: '' },
  { path: 'contact', redirectTo: '' },
  { path: 'booking', component: BookingWizardComponent },
  { path: 'print-booking', component: PrintBookingComponent },
  { path: 'admin/login', component: AdminLoginComponent },
  {
    path: 'admin',
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: '**', redirectTo: 'dashboard' },
    ],
  },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'top' })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
