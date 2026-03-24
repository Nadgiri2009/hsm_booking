import { Component, OnInit, OnDestroy } from '@angular/core';

interface SliderItem {
  image: string;
  title: string;
  subtitle: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  currentSlide = 0;
  private sliderInterval: any;

  slides: SliderItem[] = [
    { image: 'assets/images/slider1.jpg', title: 'Hutatma Smruti Mandir', subtitle: 'A Premier Venue for Your Events' },
    { image: 'assets/images/slider2.jpg', title: 'Grand Main Hall', subtitle: 'Capacity for 500+ Guests' },
    { image: 'assets/images/slider3.jpg', title: 'Modern Facilities', subtitle: 'State-of-the-art amenities for every occasion' },
    { image: 'assets/images/slider4.jpg', title: 'Beautiful Art Gallery', subtitle: 'Celebrating Culture & Heritage' },
  ];

  quickLinks = [
    { icon: 'event', labelKey: 'HOME.BOOKING_SYSTEM', route: '/booking', color: '#1a4b8c' },
    { icon: 'print', labelKey: 'HOME.PRINT_RECEIPT', route: '/print-booking', color: '#2e7d32' },
    { icon: 'cancel', labelKey: 'HOME.CANCELLATION', route: '/booking', color: '#c62828' },
    { icon: 'description', labelKey: 'HOME.TERMS', route: '/about', color: '#6a1b9a' },
    { icon: 'payments', labelKey: 'HOME.RATE_CHART', route: '/about', color: '#e65100' },
    { icon: 'contact_phone', labelKey: 'HOME.CONTACT', route: '/contact', color: '#00695c' },
  ];

  premises = [
    { icon: 'account_balance', labelKey: 'HOME.MAIN_HALL', desc: 'Main auditorium for 500+ guests', color: '#1a4b8c' },
    { icon: 'star', labelKey: 'HOME.VIP_ROOM', desc: 'Exclusive VIP lounge & meeting room', color: '#f5a623' },
    { icon: 'restaurant', labelKey: 'HOME.DINING_HALL', desc: 'Banquet hall for 200+ guests', color: '#2e7d32' },
    { icon: 'palette', labelKey: 'HOME.ART_GALLERY', desc: 'Cultural exhibitions & events', color: '#6a1b9a' },
    { icon: 'park', labelKey: 'HOME.OPEN_SPACES', desc: 'Outdoor venues for garden events', color: '#00695c' },
  ];

  notices = [
    { icon: 'account_balance_wallet', textKey: 'HOME.NOTICE_REFUND', type: 'info' },
    { icon: 'verified', textKey: 'HOME.NOTICE_PAYMENT', type: 'success' },
    { icon: 'warning', textKey: 'HOME.NOTICE_REFRESH', type: 'warning' },
    { icon: 'gavel', textKey: 'HOME.NOTICE_TERMS', type: 'info' },
  ];

  ngOnInit(): void {
    this.startSlider();
  }

  ngOnDestroy(): void {
    if (this.sliderInterval) clearInterval(this.sliderInterval);
  }

  startSlider(): void {
    this.sliderInterval = setInterval(() => {
      this.currentSlide = (this.currentSlide + 1) % this.slides.length;
    }, 5000);
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
  }
}
