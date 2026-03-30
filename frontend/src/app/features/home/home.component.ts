import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  template: `
    <main class="home-page">
      <section class="hero-slider-section">
        <div class="hero-stage">
          <div class="slides" [style.transform]="'translateX(-' + (currentSlide * 100) + '%)'">
            <article class="slide" *ngFor="let slide of slides">
              <div class="slide-bg" [style.background-image]="'url(' + slide.image + ')'"> </div>
              <div class="slide-mask"></div>
              <div class="slide-content">
                <span class="eyebrow">{{ lang.get('home.heroEyebrow') }}</span>
                <h1>{{ lang.get(slide.titleKey) }}</h1>
                <p>{{ lang.get(slide.subtitleKey) }}</p>
              </div>
            </article>
          </div>

          <button class="slider-btn prev" (click)="prevSlide()" [attr.aria-label]="lang.get('home.sliderPrev')">❮</button>
          <button class="slider-btn next" (click)="nextSlide()" [attr.aria-label]="lang.get('home.sliderNext')">❯</button>

          <div class="slider-dots">
            <button
              *ngFor="let s of slides; let i = index"
              class="dot"
              [class.active]="i === currentSlide"
              (click)="goToSlide(i)"
              [attr.aria-label]="lang.get('home.goToSlide') + ' ' + (i + 1)">
            </button>
          </div>
        </div>
      </section>

      <section class="section quick-links-section">
        <div class="container">
          <div class="section-head">
            <h2>{{ lang.get('home.quickLinks') }}</h2>
            <p>{{ lang.get('home.quickLinksSub') }}</p>
          </div>
          <div class="quick-grid">
            <a
              *ngFor="let ql of quickLinks; let i = index"
              [routerLink]="ql.route"
              class="quick-card"
              [style.animation-delay]="(i * 90) + 'ms'">
              <div class="quick-icon">{{ ql.icon }}</div>
              <h3>{{ lang.get(ql.labelKey) }}</h3>
              <p>{{ lang.get('home.openNow') }}</p>
            </a>
          </div>
        </div>
      </section>

      <section class="section premises-section">
        <div class="container">
          <div class="section-head">
            <h2>{{ lang.get('home.premises') }}</h2>
            <p>{{ lang.get('home.premisesSub') }}</p>
          </div>
          <div class="premises-grid">
            <article
              class="premise-card"
              *ngFor="let p of premises; let i = index"
              [style.animation-delay]="(i * 120) + 'ms'">
              <div class="premise-top">
                <span class="premise-icon">{{ p.icon }}</span>
                <h3>{{ lang.get(p.nameKey) }}</h3>
              </div>
              <p>{{ lang.get(p.descKey) }}</p>
              <a routerLink="/booking" class="premise-cta">{{ lang.get('home.bookSpace') }}</a>
            </article>
          </div>
        </div>
      </section>

      <section class="section notice-card-section">
        <div class="container">
          <div class="section-head">
            <h2>{{ lang.get('home.notices') }}</h2>
            <p>{{ lang.get('home.noticesSub') }}</p>
          </div>
          <div class="notice-grid">
            <article class="notice-card" *ngFor="let n of notices; let i = index" [style.animation-delay]="(i * 100) + 'ms'">
              <span class="notice-icon">{{ n.icon }}</span>
              <p>{{ lang.get(n.textKey) }}</p>
            </article>
          </div>
        </div>
      </section>
    </main>
  `,
  styles: [`
    .home-page {
      --paper: #ffffff;
      --ink: #1f2331;
      --muted: #5b6070;
      --brand: #d96a1d;
      --brand-deep: #9f3d00;
      --ocean: #0c5b7f;
      --line: #eadccf;
      --shadow: 0 16px 35px rgba(19, 27, 44, 0.12);

      position: relative;
      overflow: hidden;
      background:
        radial-gradient(circle at 12% 16%, #ffe4bf 0, rgba(255, 228, 191, 0) 45%),
        radial-gradient(circle at 86% 8%, #d7f4ff 0, rgba(215, 244, 255, 0) 42%),
        linear-gradient(180deg, #fffdf9 0%, #fff8ef 38%, #fffaf4 100%);
      padding: 1.35rem 1rem 4.5rem;
      font-family: 'Sora', 'Segoe UI', sans-serif;
      color: var(--ink);
    }

    .hero-slider-section,
    .container {
      width: min(1220px, calc(100% - 1rem));
      margin: 0 auto;
    }

    .hero-slider-section {
      position: relative;
      z-index: 2;
      margin-bottom: 1.6rem;
    }

    .hero-stage {
      position: relative;
      height: clamp(420px, 58vh, 540px);
      min-height: 420px;
      border-radius: 28px;
      overflow: hidden;
      box-shadow: var(--shadow);
      border: 1px solid rgba(255, 255, 255, 0.65);
    }

    .slides {
      display: flex;
      height: 100%;
      transition: transform 0.6s cubic-bezier(0.2, 0.7, 0, 1);
    }

    .slide {
      min-width: 100%;
      position: relative;
      height: 100%;
    }

    .slide-bg {
      position: absolute;
      inset: 0;
      background-size: cover;
      background-position: center;
      transform: scale(1.06);
    }

    .slide-mask {
      position: absolute;
      inset: 0;
      background: linear-gradient(112deg, rgba(9, 16, 27, 0.74) 6%, rgba(11, 46, 74, 0.25) 62%, rgba(11, 46, 74, 0.66) 100%);
    }

    .slide-content {
      position: relative;
      z-index: 2;
      max-width: 760px;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: clamp(2rem, 5vw, 3.2rem);
      text-align: center;
      color: #fff9f1;
      animation: fadeSlideUp 0.65s ease both;
      margin: 0 auto;
    }

    .eyebrow {
      display: inline-flex;
      padding: 0.38rem 0.75rem;
      border-radius: 999px;
      background: rgba(255, 249, 241, 0.18);
      border: 1px solid rgba(255, 249, 241, 0.33);
      font-size: 0.76rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 1.15rem;
    }

    .slide-content h1 {
      margin: 0;
      font-family: 'Fraunces', Georgia, serif;
      font-size: clamp(2rem, 4.8vw, 3.7rem);
      line-height: 1.08;
      max-width: 14ch;
      text-shadow: 0 6px 22px rgba(10, 16, 26, 0.35);
    }

    .slide-content p {
      margin: 1rem 0 1.65rem;
      max-width: 50ch;
      color: rgba(255, 251, 245, 0.95);
      line-height: 1.65;
      font-size: 1.02rem;
    }

    .slider-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      height: 44px;
      width: 44px;
      border-radius: 50%;
      border: 1px solid rgba(255, 255, 255, 0.4);
      background: rgba(8, 15, 24, 0.34);
      color: #fff;
      font-size: 1rem;
      cursor: pointer;
      z-index: 3;
      transition: background-color 0.2s ease;
    }

    .slider-btn.prev {
      left: 1rem;
    }

    .slider-btn.next {
      right: 1rem;
    }

    .slider-dots {
      position: absolute;
      left: 50%;
      bottom: 1rem;
      transform: translateX(-50%);
      display: flex;
      gap: 0.55rem;
      z-index: 4;
    }

    .dot {
      width: 11px;
      height: 11px;
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.45);
      cursor: pointer;
      transition: transform 0.2s ease, background-color 0.2s ease;
    }

    .dot.active {
      background: #fff;
      transform: scale(1.2);
    }

    .section {
      position: relative;
      z-index: 1;
      margin-top: 2.25rem;
    }

    .section-head {
      margin-bottom: 1.2rem;
      text-align: center;
    }

    .section-head h2 {
      margin: 0;
      font-family: 'Fraunces', Georgia, serif;
      font-size: clamp(1.7rem, 2.3vw, 2.2rem);
      color: #1d2436;
    }

    .section-head p {
      margin: 0.45rem 0 0;
      color: var(--muted);
      font-size: 0.95rem;
    }

    .quick-access-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 0.85rem;
    }

    .access-card {
      display: grid;
      grid-template-columns: 34px 1fr;
      gap: 0.65rem;
      align-items: center;
      text-decoration: none;
      color: #1d2433;
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid #f0e3d6;
      border-radius: 12px;
      padding: 0.7rem 0.78rem;
      transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
      animation: fadeSlideUp 0.4s ease both;
    }

    .access-card span {
      font-size: 1.1rem;
      display: inline-flex;
      justify-content: center;
      align-items: center;
      height: 34px;
      width: 34px;
      border-radius: 9px;
      background: linear-gradient(135deg, #fff2e2 0%, #e8f5ff 100%);
    }

    .access-card strong {
      font-size: 0.86rem;
      font-weight: 700;
      line-height: 1.35;
    }

    .access-card:hover {
      transform: translateY(-2px);
      border-color: #d8c1ad;
      box-shadow: 0 7px 20px rgba(18, 28, 45, 0.07);
    }

    .quick-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 0.9rem;
    }

    .quick-card {
      text-decoration: none;
      color: inherit;
      background: var(--paper);
      border: 1px solid #f1e4d9;
      border-radius: 16px;
      padding: 0.95rem;
      min-height: 138px;
      display: grid;
      align-content: space-between;
      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
      box-shadow: 0 8px 20px rgba(16, 26, 42, 0.05);
      animation: fadeSlideUp 0.46s ease both;
    }

    .quick-icon {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      display: grid;
      place-items: center;
      font-size: 1.2rem;
      background: linear-gradient(135deg, #fff1e2 0%, #eaf6ff 100%);
    }

    .quick-card h3 {
      margin: 0.72rem 0 0.2rem;
      font-size: 0.97rem;
      line-height: 1.35;
      font-weight: 700;
    }

    .quick-card p {
      margin: 0;
      font-size: 0.8rem;
      color: #6a6f7e;
    }

    .quick-card:hover {
      transform: translateY(-4px);
      border-color: #d2b59f;
      box-shadow: 0 16px 28px rgba(19, 29, 45, 0.13);
    }

    .premises-section {
      padding-top: 0.25rem;
    }

    .premises-grid {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 0.85rem;
    }

    .premise-card {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: var(--paper);
      border: 1px solid #efdfd2;
      border-radius: 18px;
      padding: 1rem;
      min-height: 208px;
      box-shadow: 0 8px 20px rgba(24, 30, 44, 0.06);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      animation: fadeSlideUp 0.52s ease both;
    }

    .premise-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 15px 30px rgba(20, 30, 45, 0.12);
    }

    .premise-top {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .premise-icon {
      font-size: 1.45rem;
      width: 40px;
      height: 40px;
      border-radius: 12px;
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, #ffedd8 0%, #e5f4ff 100%);
    }

    .premise-card h3 {
      margin: 0;
      font-size: 0.98rem;
      line-height: 1.35;
    }

    .premise-card p {
      margin: 0.8rem 0 1rem;
      color: #5e6472;
      font-size: 0.84rem;
      line-height: 1.6;
    }

    .premise-cta {
      margin-top: auto;
      text-decoration: none;
      font-weight: 700;
      color: var(--brand-deep);
      font-size: 0.82rem;
      border-bottom: 1px dashed rgba(159, 61, 0, 0.45);
      width: fit-content;
    }

    .notice-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.85rem;
    }

    .notice-card {
      background: #fffdfa;
      border: 1px solid #eddccf;
      border-left: 4px solid var(--ocean);
      border-radius: 14px;
      padding: 0.9rem;
      display: grid;
      grid-template-columns: 32px 1fr;
      gap: 0.65rem;
      align-items: start;
      box-shadow: 0 7px 16px rgba(14, 24, 38, 0.06);
      animation: fadeSlideUp 0.44s ease both;
    }

    .notice-card .notice-icon {
      width: 32px;
      height: 32px;
      border-radius: 10px;
      display: grid;
      place-items: center;
      font-size: 1rem;
      background: #ebf7fd;
    }

    .notice-card p {
      margin: 0;
      line-height: 1.58;
      font-size: 0.86rem;
      color: #414756;
    }

    @keyframes fadeSlideUp {
      from {
        opacity: 0;
        transform: translateY(16px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 1180px) {
      .hero-stage {
        height: clamp(400px, 52vh, 500px);
        min-height: 400px;
      }

      .quick-access-grid,
      .quick-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .premises-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }

    @media (max-width: 820px) {
      .quick-access-grid,
      .quick-grid,
      .premises-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 640px) {
      .home-page {
        padding-top: 0.8rem;
        padding-inline: 0.55rem;
      }

      .hero-stage {
        height: clamp(330px, 46vh, 410px);
        min-height: 330px;
        border-radius: 20px;
      }

      .slide-content {
        padding: 1.15rem;
      }

      .slide-content h1 {
        font-size: clamp(1.65rem, 8vw, 2.25rem);
      }

      .slide-content p {
        font-size: 0.9rem;
        margin-bottom: 1.2rem;
      }

      .slider-btn {
        height: 38px;
        width: 38px;
      }

      .quick-access-grid,
      .quick-grid,
      .premises-grid,
      .notice-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class HomeComponent implements OnInit, OnDestroy {
  currentSlide = 0;
  private interval: any;

  slides = [
    { image: 'assets/1.jpg', titleKey: 'home.slides.s1.title', subtitleKey: 'home.slides.s1.subtitle' },
    { image: 'assets/2.jpg', titleKey: 'home.slides.s2.title', subtitleKey: 'home.slides.s2.subtitle' },
    { image: 'assets/3.jpg', titleKey: 'home.slides.s3.title', subtitleKey: 'home.slides.s3.subtitle' }
  ];

  quickLinks = [
    { icon: '📅', labelKey: 'home.links.bookingSystem', route: '/booking' },
    { icon: '🧾', labelKey: 'home.links.printReceipt', route: '/print-booking' },
    { icon: '🏛️', labelKey: 'home.links.premisesAbout', route: '/about' },
    { icon: '🖼️', labelKey: 'home.links.gallery', route: '/gallery' },
    { icon: '📞', labelKey: 'home.links.contactUs', route: '/contact' },
    { icon: '📝', labelKey: 'home.links.postComplaint', route: '/contact' },
    { icon: '👤', labelKey: 'home.links.adminLogin', route: '/admin/login' },
    { icon: '❌', labelKey: 'home.links.bookingCancellation', route: '/print-booking' }
  ];

  premises = [
    { icon: '🏛️', nameKey: 'home.premisesItems.mandir.name', descKey: 'home.premisesItems.mandir.desc' },
    { icon: '👑', nameKey: 'home.premisesItems.vip.name', descKey: 'home.premisesItems.vip.desc' },
    { icon: '🍽️', nameKey: 'home.premisesItems.dining.name', descKey: 'home.premisesItems.dining.desc' },
    { icon: '🎨', nameKey: 'home.premisesItems.gallery.name', descKey: 'home.premisesItems.gallery.desc' },
    { icon: '🌳', nameKey: 'home.premisesItems.open.name', descKey: 'home.premisesItems.open.desc' }
  ];

  notices = [
    { icon: '💳', textKey: 'home.noticeItems.refund' },
    { icon: '📲', textKey: 'home.noticeItems.payment' },
    { icon: '⚠️', textKey: 'home.noticeItems.noRefresh' },
    { icon: '📄', textKey: 'home.noticeItems.tnc' }
  ];

  constructor(public lang: LanguageService) {}

  ngOnInit(): void {
    this.interval = setInterval(() => this.nextSlide(), 5000);
  }

  ngOnDestroy(): void {
    clearInterval(this.interval);
  }

  nextSlide(): void {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
  }

  prevSlide(): void {
    this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
  }
}
