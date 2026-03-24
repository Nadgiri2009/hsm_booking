import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="gallery-page">
      <div class="page-header"><h1>Gallery</h1><p>Photos & Videos of Hutatma Smruti Mandir</p></div>
      <div class="container">
        <div class="tabs">
          <button [class.active]="tab==='photos'" (click)="tab='photos'">📷 Photo Gallery</button>
          <button [class.active]="tab==='videos'" (click)="tab='videos'">🎬 Video Gallery</button>
        </div>
        <div class="photo-grid" *ngIf="tab==='photos'">
          <div class="photo-card" *ngFor="let p of photos">
            <img [src]="p.src" [alt]="p.label" loading="lazy">
            <span>{{ p.label }}</span>
          </div>
        </div>
        <div class="video-grid" *ngIf="tab==='videos'">
          <div class="video-card" *ngFor="let v of videos">
            <div class="video-thumb" [style.background-image]="'url(' + v.thumb + ')'">
              <div class="play-overlay">▶</div>
            </div>
            <span>{{ v.title }}</span>
          </div>
        </div>
      </div>
    </div>`,
  styles: [`
    .page-header { background:linear-gradient(120deg,var(--ocean-deep),var(--ocean)); color:#fff8ef; text-align:center; padding:3rem 1rem; }
    .container { max-width:1200px; margin:0 auto; padding:2rem 1.5rem; }
    .tabs { display:flex; gap:.5rem; margin-bottom:2rem; border-bottom:2px solid #e0e0e0; }
    .tabs button { padding:.6rem 1.5rem; border:none; background:none; cursor:pointer; font-size:.95rem; border-bottom:3px solid transparent; margin-bottom:-2px; }
    .tabs button.active { border-bottom-color:var(--ocean); color:var(--ocean-deep); font-weight:700; }
    .photo-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); gap:1rem; }
    .photo-card { background:white; border-radius:10px; padding:.65rem; box-shadow:0 2px 8px rgba(0,0,0,.08); }
    .photo-card img { width:100%; height:190px; object-fit:cover; border-radius:8px; }
    .photo-card span { display:block; margin-top:.55rem; font-size:.86rem; color:var(--ocean-deep); font-weight:600; text-align:center; }
    .video-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:1.5rem; }
    .video-card { background:white; border-radius:10px; padding:.7rem; box-shadow:0 2px 8px rgba(0,0,0,.08); }
    .video-thumb {
      height:180px;
      border-radius:8px;
      background-size:cover;
      background-position:center;
      position:relative;
      overflow:hidden;
    }
    .play-overlay {
      position:absolute;
      inset:0;
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:2.5rem;
      color:white;
      background:rgba(0,0,0,.35);
    }
    .video-card span { display:block; margin-top:.6rem; font-size:.86rem; color:var(--ocean-deep); font-weight:600; text-align:center; }
  `]
})
export class GalleryComponent {
  tab = 'photos';
  photos = [
    { src: 'assets/1.jpg', label:'Main Auditorium' },
    { src: 'assets/2.jpg', label:'VIP Room' },
    { src: 'assets/3.jpg', label:'Dining Hall' },
    { src: 'assets/1.jpg', label:'Art Gallery' },
    { src: 'assets/2.jpg', label:'Garden Area' },
    { src: 'assets/3.jpg', label:'Open Stage' }
  ];

  videos = [
    { title:'Venue Tour – Main Hall', thumb: 'assets/1.jpg' },
    { title:'Wedding Reception Highlights', thumb: 'assets/2.jpg' },
    { title:'Corporate Conference Highlights', thumb: 'assets/3.jpg' },
    { title:'Cultural Program Highlights', thumb: 'assets/1.jpg' }
  ];
}
