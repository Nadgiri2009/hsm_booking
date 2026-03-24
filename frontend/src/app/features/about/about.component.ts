import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="about-page">
      <div class="page-header"><h1>About Hutatma Smruti Mandir</h1><p>Heritage venue managed by Solapur Municipal Corporation</p></div>
      <div class="container">
        <section class="about-section">
          <h2>About the Venue</h2>
          <p>Hutatma Smruti Mandir is a prestigious heritage venue managed by Solapur Municipal Corporation (SMC), dedicated to the memory of freedom fighters. The venue offers a serene and culturally rich environment for social, cultural, and corporate events.</p>
        </section>
        <section class="about-section">
          <h2>Facilities</h2>
          <div class="facilities-grid">
            <div class="facility-card" *ngFor="let f of facilities">
              <div class="f-icon">{{ f.icon }}</div>
              <h3>{{ f.name }}</h3>
              <p>{{ f.desc }}</p>
              <p class="rent">₹{{ f.rent }}/day</p>
            </div>
          </div>
        </section>
        <div class="policy-row">
          <section class="about-section policy-section">
            <h2>Rules & Regulation</h2>
            <ul class="rules-list">
              <li *ngFor="let r of rules">{{ r }}</li>
            </ul>
          </section>
          <section class="about-section policy-section">
            <h2>Cancellation & Refunds</h2>
            <div class="refund-table">
              <div class="refund-row header"><span>Cancellation Before</span><span>Refund %</span></div>
              <div class="refund-row" *ngFor="let p of refundPolicy"><span>{{ p.period }}</span><span class="refund-pct">{{ p.pct }}</span></div>
            </div>
          </section>
        </div>
      </div>
    </div>`,
  styles: [`
    .page-header { background:linear-gradient(120deg,var(--ocean-deep),var(--ocean)); color:#fff8ef; text-align:center; padding:3rem 1rem; }
    .page-header h1 { margin:0; } .page-header p { margin:.5rem 0 0; opacity:.8; }
    .container { max-width:1000px; margin:0 auto; padding:2rem 1.5rem; }
    .about-section { margin-bottom:3rem; }
    .about-section h2 { color:var(--ocean-deep); margin-bottom:1rem; padding-bottom:.5rem; border-bottom:3px solid rgba(217,106,29,.6); display:inline-block; }
    .facilities-grid { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:1rem; margin-top:1rem; }
    .facility-card { border:1px solid #e0e0e0; border-radius:10px; padding:1.25rem; text-align:center; }
    .f-icon { font-size:2rem; margin-bottom:.5rem; }
    .facility-card h3 { color:var(--ocean-deep); margin:.5rem 0; font-size:.95rem; }
    .facility-card p { font-size:.83rem; color:#666; margin:0; }
    .rent { color:#4caf50; font-weight:700; margin-top:.5rem !important; }
    .policy-row { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:2rem; align-items:start; }
    .policy-section { margin-bottom:0; }
    .rules-list li { margin-bottom:.6rem; line-height:1.6; }
    .refund-table { border:1px solid #e0e0e0; border-radius:8px; overflow:hidden; }
    .refund-row { display:flex; justify-content:space-between; padding:.75rem 1rem; border-bottom:1px solid #f0f0f0; }
    .refund-row.header { background:linear-gradient(120deg,var(--ocean-deep),var(--ocean)); color:white; font-weight:700; }
    .refund-pct { color:#4caf50; font-weight:700; }
  `]
})
export class AboutComponent {
  facilities = [
    { icon:'🏛️', name:'Main Auditorium', desc:'500 person capacity', rent:'15,000' },
    { icon:'👑', name:'VIP Room', desc:'50 person capacity', rent:'5,000' },
    { icon:'🍽️', name:'Dining Hall', desc:'200 person capacity', rent:'8,000' },
    { icon:'🎨', name:'Art Gallery', desc:'100 person capacity', rent:'6,000' },
    { icon:'🌳', name:'Open Space', desc:'300 person capacity', rent:'10,000' }
  ];
  rules = [
    'Booking must be made at least 7 days in advance.',
    'The booked premises must be vacated by the specified time.',
    'No illegal or anti-social activities are permitted on the premises.',
    'The applicant is responsible for any damage caused during the event.',
    'Alcohol consumption is strictly prohibited.',
    'Decoration items must not damage the walls or fixtures.',
    'SMC staff must be allowed entry at any time for inspection.',
    'Loudspeakers must adhere to the prescribed noise levels.'
  ];
  refundPolicy = [
    { period: '2 months or more before event', pct: '90% Refund' },
    { period: '1 month before event', pct: '80% Refund' },
    { period: '7 days before event', pct: '50% Refund' },
    { period: 'Less than 7 days', pct: 'Security Deposit Only' }
  ];
}
