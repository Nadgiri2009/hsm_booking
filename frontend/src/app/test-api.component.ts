import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-test-api',
  standalone: true,
  template: `
    <div>
      <h2>API Test</h2>
      <button (click)="testApi()">Test Premises API</button>
      <p *ngIf="result">{{ result }}</p>
      <div *ngIf="premises">
        <h3>Premises:</h3>
        <ul>
          <li *ngFor="let p of premises">{{ p.id }} - {{ p.name }}</li>
        </ul>
      </div>
    </div>
  `
})
export class TestApiComponent implements OnInit {
  result: string = '';
  premises: any[] | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.testApi();
  }

  testApi(): void {
    this.http.get<any>('http://localhost:8000/api/premises/')
      .subscribe({
        next: (data) => {
          this.result = 'Success! Received: ' + JSON.stringify(data).substring(0, 100);
          if (Array.isArray(data)) {
            this.premises = data;
          } else if (data.results) {
            this.premises = data.results;
          }
        },
        error: (err) => {
          this.result = 'Error: ' + JSON.stringify(err);
        }
      });
  }
}
