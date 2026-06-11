import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  currentLang = 'en';
  isAdminLoggedIn = false;
  mobileMenuOpen = false;

  navLinks = [
    { label: 'NAV.HOME', route: '/', icon: 'home' },
    { label: 'NAV.ABOUT', route: '/about', icon: 'info' },
    { label: 'NAV.PRINT_BOOKING', route: '/print-booking', icon: 'print' },
    { label: 'NAV.GALLERY', route: '/gallery', icon: 'photo_library' },
    { label: 'NAV.CONTACT', route: '/contact', icon: 'contact_mail' },
  ];

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentLang = localStorage.getItem('hsm_lang') || 'en';
    this.authService.isLoggedIn$.subscribe(v => (this.isAdminLoggedIn = v));
  }

  toggleLanguage(): void {
    this.currentLang = this.currentLang === 'en' ? 'mr' : 'en';
    // ngx-translate is not used here; persist language selection only
    localStorage.setItem('hsm_lang', this.currentLang);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/admin/login']);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  goToBooking(): void {
    this.mobileMenuOpen = false;
    this.router.navigate(['/booking']);
  }
}
