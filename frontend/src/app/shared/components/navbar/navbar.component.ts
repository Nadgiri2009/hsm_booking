import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../../core/services/language.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  template: `
    <nav class="site-navbar">
      <div class="nav-container">
        <a class="brand" routerLink="/home" (click)="closeMenu()">
          <img src="assets/images/logo.png" alt="SMC Logo" class="brand-logo" onerror="this.style.display='none'">
          <span class="brand-copy">
            <strong>{{ lang.get('nav.brandTitle') }}</strong>
            <small>{{ lang.get('nav.brandSub') }}</small>
          </span>
        </a>

        <ul class="nav-links desktop-only">
          <li *ngFor="let item of navItems">
            <a
              [routerLink]="item.route"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: item.route === '/home' }"
              (click)="closeMenu()">
              {{ lang.get(item.labelKey) }}
            </a>
          </li>
        </ul>

        <div class="nav-actions desktop-only">
          <button class="lang-btn" (click)="lang.toggleLanguage()">
            {{ lang.currentLang === 'en' ? 'मराठी' : 'EN' }}
          </button>
          <a routerLink="/booking" class="book-btn" (click)="closeMenu()">{{ lang.get('nav.bookNow') }}</a>
          <a *ngIf="!auth.isLoggedIn" routerLink="/admin/login" class="admin-btn" (click)="closeMenu()">
            {{ lang.get('nav.adminLogin') }}
          </a>
          <a *ngIf="auth.isLoggedIn" routerLink="/admin/dashboard" class="admin-btn" (click)="closeMenu()">
            {{ lang.get('nav.dashboard') }}
          </a>
          <button *ngIf="auth.isLoggedIn" class="logout-btn" (click)="logout()">{{ lang.get('nav.logout') }}</button>
        </div>

        <button class="menu-toggle mobile-only" (click)="menuOpen = !menuOpen" aria-label="Toggle menu">
          <span></span><span></span><span></span>
        </button>
      </div>

      <div class="mobile-panel" [class.open]="menuOpen">
        <a
          *ngFor="let item of navItems"
          [routerLink]="item.route"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: item.route === '/home' }"
          (click)="closeMenu()">
          {{ lang.get(item.labelKey) }}
        </a>
        <a routerLink="/booking" class="book-btn mobile-book" (click)="closeMenu()">{{ lang.get('nav.bookNow') }}</a>
        <a *ngIf="!auth.isLoggedIn" routerLink="/admin/login" class="admin-btn" (click)="closeMenu()">
          {{ lang.get('nav.adminLogin') }}
        </a>
        <a *ngIf="auth.isLoggedIn" routerLink="/admin/dashboard" class="admin-btn" (click)="closeMenu()">{{ lang.get('nav.dashboard') }}</a>
        <button *ngIf="auth.isLoggedIn" class="logout-btn" (click)="logout()">{{ lang.get('nav.logout') }}</button>
        <button class="lang-btn" (click)="lang.toggleLanguage()">
          {{ lang.currentLang === 'en' ? 'मराठी' : 'EN' }}
        </button>
      </div>
    </nav>
  `,
  styles: [`
    .site-navbar {
      position: sticky;
      top: 0;
      z-index: 1200;
      backdrop-filter: blur(8px);
      background: linear-gradient(105deg, rgba(248, 231, 207, 0.97), rgba(227, 242, 250, 0.97));
      border-bottom: 1px solid rgba(29, 62, 74, 0.16);
      box-shadow: 0 8px 20px rgba(53, 74, 83, 0.14);
      font-family: 'Sora', 'Segoe UI', sans-serif;
    }

    .nav-container {
      width: min(1240px, calc(100% - 1rem));
      margin: 0 auto;
      min-height: 74px;
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 1rem;
    }

    .brand {
      display: inline-flex;
      align-items: center;
      gap: 0.7rem;
      text-decoration: none;
      color: #1d313a;
      min-width: 250px;
    }

    .brand-logo {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      object-fit: contain;
      border: 2px solid rgba(182, 129, 66, 0.55);
      background: rgba(255, 255, 255, 0.6);
    }

    .brand-copy {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }

    .brand-copy strong {
      font-size: 0.93rem;
      font-weight: 700;
      letter-spacing: 0.01em;
    }

    .brand-copy small {
      font-size: 0.72rem;
      color: rgba(29, 49, 58, 0.78);
      letter-spacing: 0.02em;
    }

    .nav-links {
      display: flex;
      align-items: center;
      justify-content: center;
      list-style: none;
      margin: 0;
      padding: 0;
      gap: 0.2rem;
    }

    .nav-links a {
      color: #24404d;
      text-decoration: none;
      font-size: 0.86rem;
      font-weight: 600;
      padding: 0.48rem 0.72rem;
      border-radius: 10px;
      transition: background-color 0.2s ease, color 0.2s ease;
      white-space: nowrap;
    }

    .nav-links a:hover,
    .nav-links a.active {
      background: rgba(18, 93, 110, 0.12);
      color: #0a3d4e;
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 0.52rem;
    }

    .lang-btn,
    .logout-btn,
    .book-btn,
    .admin-btn {
      border: 1px solid rgba(31, 74, 89, 0.2);
      border-radius: 999px;
      font-size: 0.78rem;
      font-weight: 700;
      padding: 0.4rem 0.78rem;
      text-decoration: none;
      cursor: pointer;
      transition: transform 0.2s ease, background-color 0.2s ease;
    }

    .lang-btn,
    .logout-btn {
      color: #173744;
      background: rgba(255, 255, 255, 0.7);
    }

    .book-btn {
      color: #fff;
      background: linear-gradient(135deg, #d7751d, #9f3d00);
      border-color: rgba(255, 219, 176, 0.55);
    }

    .admin-btn {
      color: #073b5b;
      background: #d0f4ff;
      border-color: #a5dff0;
    }

    .lang-btn:hover,
    .logout-btn:hover,
    .book-btn:hover,
    .admin-btn:hover {
      transform: translateY(-1px);
    }

    .menu-toggle {
      height: 40px;
      width: 40px;
      border-radius: 10px;
      border: 1px solid rgba(24, 68, 82, 0.3);
      background: rgba(255, 255, 255, 0.65);
      display: inline-flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 4px;
      cursor: pointer;
    }

    .menu-toggle span {
      width: 18px;
      height: 2px;
      background: #134458;
      display: block;
      border-radius: 2px;
    }

    .mobile-only {
      display: none;
    }

    .mobile-panel {
      display: none;
      width: min(1240px, calc(100% - 1rem));
      margin: 0 auto;
    }

    @media (max-width: 1080px) {
      .desktop-only {
        display: none;
      }

      .mobile-only {
        display: inline-flex;
      }

      .nav-container {
        grid-template-columns: 1fr auto;
      }

      .brand {
        min-width: unset;
      }

      .mobile-panel.open {
        display: grid;
        gap: 0.45rem;
        padding: 0.75rem 0 1rem;
      }

      .mobile-panel a,
      .mobile-panel button {
        display: block;
        width: 100%;
        text-align: center;
        text-decoration: none;
        color: #123848;
        border: 1px solid rgba(23, 59, 70, 0.2);
        border-radius: 11px;
        background: rgba(255, 255, 255, 0.78);
        padding: 0.58rem 0.7rem;
        font-size: 0.85rem;
      }

      .mobile-panel a.active {
        background: rgba(18, 93, 110, 0.16);
      }

      .mobile-panel .mobile-book {
        background: linear-gradient(135deg, #d7751d, #9f3d00);
      }

      .mobile-panel .admin-btn {
        background: #d0f4ff;
        color: #073b5b;
      }
    }
  `]
})
export class NavbarComponent {
  navItems = [
    { labelKey: 'nav.home', route: '/home' },
    { labelKey: 'nav.about', route: '/about' },
    { labelKey: 'nav.print', route: '/print-booking' },
    { labelKey: 'nav.gallery', route: '/gallery' },
    { labelKey: 'nav.contact', route: '/contact' }
  ];

  menuOpen = false;

  constructor(public lang: LanguageService, public auth: AuthService) {}

  closeMenu(): void {
    this.menuOpen = false;
  }

  logout(): void {
    this.menuOpen = false;
    this.auth.logout();
  }
}
