import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../services/auth.service';
@Component({
  selector: 'app-admin-login',
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.scss'],
})
export class AdminLoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  showPassword = false;
  showForgotPassword = false;
  forgotEmail = '';
  forgotLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/admin/dashboard']);
    }

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      rememberMe: [false],
    });
  }

  login(): void {
    if (this.loginForm.invalid) return;
    this.isLoading = true;
    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: () => {
        this.snackBar.open('Login successful!', 'Close', { duration: 2000 });
        this.router.navigate(['/admin/dashboard']);
      },
      error: (err: any) => {
        this.isLoading = false;
        const msg = err.error?.detail || 'Invalid credentials. Please try again.';
        this.snackBar.open(msg, 'Close', { duration: 4000, panelClass: ['error-snack'] });
      },
    });
  }

  sendForgotPassword(): void {
    if (!this.forgotEmail) return;
    this.forgotLoading = true;
    this.authService.forgotPassword(this.forgotEmail).subscribe({
      next: () => {
        this.forgotLoading = false;
        this.showForgotPassword = false;
        this.snackBar.open('Password reset link sent to your email.', 'Close', { duration: 4000 });
      },
      error: () => {
        this.forgotLoading = false;
        this.snackBar.open('Email not found.', 'Close', { duration: 3000 });
      },
    });
  }
}
