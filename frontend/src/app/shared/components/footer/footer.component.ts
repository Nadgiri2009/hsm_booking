import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-col">
          <h4>{{ lang.get('footer.brandTitle') }}</h4>
          <p>{{ lang.get('footer.address') }}</p>
          <p>📞 0217-2720000</p>
          <p>✉️ hsm&#64;ssolapurcorporation.gov.in</p>
        </div>
        <div class="footer-col">
          <h4>{{ lang.get('footer.quickLinks') }}</h4>
          <ul>
            <li><a routerLink="/home">{{ lang.get('nav.home') }}</a></li>
            <li><a routerLink="/booking">{{ lang.get('nav.bookNow') }}</a></li>
            <li><a routerLink="/print-booking">{{ lang.get('home.links.printReceipt') }}</a></li>
            <li><a routerLink="/print-booking" [queryParams]="{ action: 'cancel' }">{{ lang.get('footer.bookingCancellation') }}</a></li>
            <li><a routerLink="/about">{{ lang.get('footer.terms') }}</a></li>
            <li><a routerLink="/contact">{{ lang.get('nav.contact') }}</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>{{ lang.get('footer.contact') }}</h4>
          <p>{{ lang.get('footer.bookingOffice') }}: 0217-2720100</p>
          <p>{{ lang.get('footer.helpdesk') }}: 0217-2720200</p>
          <p>{{ lang.get('footer.emergency') }}: 0217-2720300</p>
          <div class="social-links">
            <a href="#" aria-label="Facebook">📘</a>
            <a href="#" aria-label="Twitter">🐦</a>
            <a href="#" aria-label="YouTube">▶️</a>
          </div>
        </div>
        <div class="footer-col map-col">
          <h4>{{ lang.get('footer.locateUs') }}</h4>
          <div class="map-placeholder">
            <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3801.5836363957687!2d75.89804871136354!3d17.669868383196466!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc5da78bc7dd5f1%3A0xf175aa31edaeaedd!2sHutatma%20Smruti%20Mandir!5e0!3m2!1sen!2sin!4v1773649170477!5m2!1sen!2sin" width="600" height="250" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <p>{{ lang.get('footer.developed') }}</p>
        <p>© {{ year }} {{ lang.get('footer.rights') }}</p>
      </div>
    </footer>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .footer {
      margin-top: auto;
      padding: 0.5rem 0 0;
      background: linear-gradient(180deg, #163747 0%, #0f2a38 100%);
      font-family: 'Sora', 'Segoe UI', sans-serif;
      width: 100%;
    }
    .footer-content {
      width: min(1080px, calc(100% - 1.5rem));
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 0.75rem;
      padding: 0;
      justify-content: center;
    }
    .footer-col {
      background: rgba(255, 255, 255, 0.82);
      border: 1px solid rgba(234, 220, 207, 0.95);
      border-radius: 16px;
      box-shadow: 0 10px 22px rgba(20, 30, 45, 0.06);
      padding: 0.9rem;
      backdrop-filter: blur(10px);
      text-align: center;
    }
    .footer-col h4 {
      color: #173847;
      margin-bottom: 0.6rem;
      font-size: 0.92rem;
      font-family: 'Fraunces', Georgia, serif;
    }
    .footer-col p { font-size: 0.8rem; margin-bottom: 0.35rem; line-height: 1.45; color: #4f596d; }
    .footer-col ul { list-style: none; padding: 0; margin: 0; }
    .footer-col ul li { margin-bottom: 0.28rem; }
    .footer-col ul li a { color: #285061; text-decoration: none; font-size: 0.8rem; font-weight: 600; }
    .footer-col ul li a:hover { color: #9f3d00; }
    .social-links { display: flex; gap: 0.55rem; margin-top: 0.55rem; font-size: 1rem; }
    .social-links { justify-content: center; }
    .social-links a { text-decoration: none; }
    .map-placeholder { border-radius: 14px; overflow: hidden; border: 1px solid rgba(234, 220, 207, 0.95); }
    .map-placeholder { display: flex; justify-content: center; }
    .map-placeholder iframe { width: 100%; height: 160px; display: block; }
    .footer-bottom {
      width: min(1080px, calc(100% - 1.5rem));
      margin: 0.65rem auto 0;
      text-align: center;
      padding: 0.75rem 1rem 1rem;
      font-size: 0.74rem;
      color: #dbe6f2;
      background: rgba(255, 255, 255, 0.06);
      border-top: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 12px 12px 0 0;
    }
    .footer-bottom p { margin: 0.2rem 0; }

    /* Responsiveness removed — footer is desktop/web-only */
  `]
})
export class FooterComponent {
  year = new Date().getFullYear();
  constructor(public lang: LanguageService) {}
}
