import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="login-header">
          <div class="login-logo">🏛️</div>
          <h2>Admin Login</h2>
          <p>Hutatma Smruti Mandir – SMC Portal</p>
        </div>
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label>Email Address</label>
            <input type="email" formControlName="email" placeholder="admin@solapurcorp.gov.in">
          </div>
          <div class="form-group">
            <label>Password</label>
            <div class="password-input">
              <input [type]="showPwd ? 'text' : 'password'" formControlName="password" placeholder="Enter password">
              <button type="button" class="pwd-toggle" (click)="showPwd = !showPwd">{{ showPwd ? '🙈' : '👁️' }}</button>
            </div>
          </div>
          <div class="form-row-check">
            <label class="checkbox-label"><input type="checkbox" formControlName="remember_me"> Remember Me</label>
            <a href="#" class="forgot-link">Forgot Password?</a>
          </div>
          <div class="error-msg" *ngIf="errorMsg">{{ errorMsg }}</div>
          <button type="submit" class="btn-login" [disabled]="loginForm.invalid || isLoading">
            {{ isLoading ? 'Logging in...' : 'Login' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-page { min-height:100vh; background:transparent; display:flex; align-items:center; justify-content:center; padding:2rem; }
    .login-card { background:rgba(255,255,255,.86); border:1px solid var(--line); border-radius:22px; padding:2.5rem; width:100%; max-width:420px; box-shadow:0 20px 60px rgba(20,30,45,0.14); backdrop-filter:blur(10px); }
    .login-header { text-align:center; margin-bottom:2rem; }
    .login-logo { font-size:3rem; margin-bottom:.75rem; }
    .login-header h2 { color:var(--ocean-deep); margin:0 0 .3rem; }
    .login-header p { color:#666; font-size:.85rem; }
    .form-group { margin-bottom:1.25rem; }
    .form-group label { display:block; font-weight:600; margin-bottom:.4rem; font-size:.88rem; }
    .form-group input { width:100%; padding:.7rem 1rem; border:1px solid #ddd; border-radius:8px; font-size:.9rem; box-sizing:border-box; }
    .form-group input:focus { outline:none; border-color:var(--ocean); }
    .password-input { position:relative; }
    .pwd-toggle { position:absolute; right:.75rem; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; }
    .form-row-check { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; }
    .checkbox-label { display:flex; align-items:center; gap:.4rem; font-size:.88rem; cursor:pointer; }
    .forgot-link { font-size:.85rem; color:var(--ocean); text-decoration:none; }
    .error-msg { background:#fce4ec; color:#c62828; padding:.75rem; border-radius:6px; margin-bottom:1rem; font-size:.88rem; }
    .btn-login { width:100%; padding:.85rem; background:linear-gradient(135deg,var(--ocean),#0d7488); color:white; border:none; border-radius:999px; font-size:1rem; font-weight:600; cursor:pointer; }
    .btn-login:hover:not(:disabled) { background:linear-gradient(135deg,#0d7488,var(--ocean)); }
    .btn-login:disabled { opacity:.6; cursor:not-allowed; }
  `]
})
export class AdminLoginComponent {
  loginForm: FormGroup;
  showPwd = false; isLoading = false; errorMsg = '';
  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.loginForm = this.fb.group({ email: ['', [Validators.required, Validators.email]], password: ['', Validators.required], remember_me: [false] });
  }
  onSubmit(): void {
    if (this.loginForm.invalid) return;
    this.isLoading = true; this.errorMsg = '';
    const { email, password, remember_me } = this.loginForm.value;
    this.auth.login(email, password, remember_me).subscribe({
      next: () => this.router.navigate(['/admin/dashboard']),
      error: (err) => {
        this.isLoading = false;
        const apiDetail = err?.error?.detail || err?.error?.message || err?.message;
        if (err?.status === 0) {
          this.errorMsg = 'Unable to reach backend API. Start backend server on port 8000 and retry.';
          return;
        }
        if (err?.status === 404) {
          this.errorMsg = 'Login API route not found. Verify frontend proxy and backend server port.';
          return;
        }
        this.errorMsg = apiDetail || 'Invalid credentials.';
      }
    });
  }
}
 AdminLoginComponent