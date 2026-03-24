import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './components/home/home.component';
import { AboutComponent } from './components/about/about.component';
import { GalleryComponent } from './components/gallery/gallery.component';
import { ContactComponent } from './components/contact/contact.component';
import { AdminLoginComponent } from './components/admin/admin-login/admin-login.component';
import { AdminDashboardComponent } from './components/admin/admin-dashboard/admin-dashboard.component';
import { AdminPremisesComponent } from './components/admin/admin-premises/admin-premises.component';
import { AdminHolidaysComponent } from './components/admin/admin-holidays/admin-holidays.component';
import { AdminBookingsComponent } from './components/admin/admin-bookings/admin-bookings.component';
import { AdminCancellationsComponent } from './components/admin/admin-cancellations/admin-cancellations.component';
import { AdminComplaintsComponent } from './components/admin/admin-complaints/admin-complaints.component';
import { BookingWizardComponent } from './components/booking/booking-wizard/booking-wizard.component';
import { PrintBookingComponent } from './components/print-booking/print-booking.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'about', component: AboutComponent },
  { path: 'gallery', component: GalleryComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'booking', component: BookingWizardComponent },
  { path: 'print-booking', component: PrintBookingComponent },
  { path: 'admin/login', component: AdminLoginComponent },
  {
    path: 'admin',
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'premises', component: AdminPremisesComponent },
      { path: 'holidays', component: AdminHolidaysComponent },
      { path: 'bookings', component: AdminBookingsComponent },
      { path: 'cancellations', component: AdminCancellationsComponent },
      { path: 'complaints', component: AdminComplaintsComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'top' })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
