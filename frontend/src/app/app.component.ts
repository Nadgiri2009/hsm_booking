import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { LanguageService } from './core/services/language.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  template: `
    <app-navbar></app-navbar>
    <main class="main-content">
      <router-outlet></router-outlet>
    </main>
    <app-footer></app-footer>
  `,
  styles: [`
    .main-content {
      min-height: calc(100vh - 140px);
    }
  `]
})
export class AppComponent implements OnInit {
  constructor(private langService: LanguageService) {}

  ngOnInit(): void {
    const saved = localStorage.getItem('hsm_lang') || 'en';
    this.langService.loadLanguage(saved);
    // If user opened root or /home with a bookingId query param, strip it
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has('bookingId')) {
        const p = window.location.pathname || '/';
        if (p === '/' || p === '/home') {
          params.delete('bookingId');
          const qs = params.toString();
          const newUrl = p + (qs ? ('?' + qs) : '');
          history.replaceState(null, '', newUrl);
        }
      }
    } catch (e) {
      // ignore
    }
  }
}
