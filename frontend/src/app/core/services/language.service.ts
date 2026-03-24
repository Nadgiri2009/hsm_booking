import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private currentLangSubject = new BehaviorSubject<string>('en');
  currentLang$ = this.currentLangSubject.asObservable();
  private translations: any = {};

  constructor(private http: HttpClient) {
    const saved = localStorage.getItem('hsm_lang') || 'en';
    this.loadLanguage(saved);
  }

  loadLanguage(lang: string): void {
    this.currentLangSubject.next(lang);
    this.http.get(`assets/i18n/${lang}.json`).subscribe({
      next: (t) => {
        this.translations = t;
        localStorage.setItem('hsm_lang', lang);
      },
      error: () => {
        // Fallback to English bundle if the requested file is missing.
        if (lang !== 'en') {
          this.loadLanguage('en');
        }
      }
    });
  }

  toggleLanguage(): void {
    const next = this.currentLangSubject.value === 'en' ? 'mr' : 'en';
    this.loadLanguage(next);
  }

  get(key: string): string {
    const keys = key.split('.');
    let val = this.translations;
    for (const k of keys) val = val?.[k];
    return val || key;
  }

  get currentLang(): string {
    return this.currentLangSubject.value;
  }
}
