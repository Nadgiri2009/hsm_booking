
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

// Angular Material omitted in this minimal build to avoid missing package errors

// ngx-translate removed (not used)

// Routing
import { AppRoutingModule } from './app-routing.module';

// Components
import { AppComponent } from './app.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { HomeComponent } from './components/home/home.component';
// Optional pages removed: About/Gallery/Contact not included in this build
import { AdminLoginComponent } from './components/admin/admin-login/admin-login.component';
import { AdminDashboardComponent } from './components/admin/admin-dashboard/admin-dashboard.component';
// Keep only AdminLogin and AdminDashboard which exist
import { BookingWizardComponent } from './components/booking/booking-wizard/booking-wizard.component';
// Booking child components are consolidated inside BookingWizardComponent in this build
import { PaymentComponent } from './components/booking/payment/payment.component';
import { PrintBookingComponent } from './components/print-booking/print-booking.component';
// shared components not present in this minimal build

// Services
import { AuthService } from './services/auth.service';
import { BookingService } from './services/booking.service';
import { PremiseService } from './services/premise.service';
import { PaymentService } from './services/payment.service';
import { NotificationService } from './services/notification.service';

// Angular Material snackbar
import { MatSnackBarModule } from '@angular/material/snack-bar';

// Guards
import { AuthGuard } from './guards/auth.guard';

// HTTP interceptors
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './services/auth.interceptor';

// Translation loader removed

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    FooterComponent,
    HomeComponent,
    AdminLoginComponent,
    AdminDashboardComponent,
    BookingWizardComponent,
    PaymentComponent,
    PrintBookingComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    AppRoutingModule,
    // ngx-translate removed from imports
    MatSnackBarModule,
  ],
  providers: [
    AuthService, BookingService, PremiseService, PaymentService, NotificationService,
    AuthGuard,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
