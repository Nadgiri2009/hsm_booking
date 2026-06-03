import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { SmsComponent } from './sms.component';

@NgModule({
  declarations: [SmsComponent],
  imports: [BrowserModule, FormsModule, HttpClientModule],
  providers: [],
  bootstrap: [SmsComponent],
})
export class AppModule {}
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';

// ngx-translate
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

// Routing
import { AppRoutingModule } from './app-routing.module';

// Components
import { AppComponent } from './app.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
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
import { PremiseSelectComponent } from './components/booking/premise-select/premise-select.component';
import { DateTimeSelectComponent } from './components/booking/date-time-select/date-time-select.component';
import { BookingSummaryComponent } from './components/booking/booking-summary/booking-summary.component';
import { ApplicantDetailsComponent } from './components/booking/applicant-details/applicant-details.component';
import { BankDetailsComponent } from './components/booking/bank-details/bank-details.component';
import { PaymentComponent } from './components/booking/payment/payment.component';
import { PrintBookingComponent } from './components/print-booking/print-booking.component';
import { ImageSliderComponent } from './components/shared/image-slider/image-slider.component';
import { ConfirmDialogComponent } from './components/shared/confirm-dialog/confirm-dialog.component';

// Services
import { AuthService } from './services/auth.service';
import { BookingService } from './services/booking.service';
import { PremiseService } from './services/premise.service';
import { PaymentService } from './services/payment.service';
import { NotificationService } from './services/notification.service';

// Guards
import { AuthGuard } from './guards/auth.guard';

// HTTP interceptors
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './services/auth.interceptor';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    FooterComponent,
    HomeComponent,
    AboutComponent,
    GalleryComponent,
    ContactComponent,
    AdminLoginComponent,
    AdminDashboardComponent,
    AdminPremisesComponent,
    AdminHolidaysComponent,
    AdminBookingsComponent,
    AdminCancellationsComponent,
    AdminComplaintsComponent,
    BookingWizardComponent,
    PremiseSelectComponent,
    DateTimeSelectComponent,
    BookingSummaryComponent,
    ApplicantDetailsComponent,
    BankDetailsComponent,
    PaymentComponent,
    PrintBookingComponent,
    ImageSliderComponent,
    ConfirmDialogComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    AppRoutingModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
      defaultLanguage: 'en',
    }),
    MatToolbarModule, MatMenuModule, MatButtonModule, MatIconModule,
    MatCardModule, MatStepperModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatDatepickerModule, MatNativeDateModule,
    MatTableModule, MatPaginatorModule, MatSnackBarModule, MatDialogModule,
    MatProgressSpinnerModule, MatBadgeModule, MatChipsModule, MatTabsModule,
    MatTooltipModule, MatRadioModule, MatCheckboxModule, MatDividerModule,
    MatSidenavModule, MatListModule, MatExpansionModule,
  ],
  providers: [
    AuthService, BookingService, PremiseService, PaymentService, NotificationService,
    AuthGuard,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
