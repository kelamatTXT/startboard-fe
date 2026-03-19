import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-callback',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="callback-container">
      <div class="callback-card">
        <div class="logo">⭐</div>
        <ng-container *ngIf="!error; else errorTpl">
          <div class="spinner"></div>
          <h2>Đang xác thực...</h2>
          <p>Vui lòng đợi trong giây lát</p>
        </ng-container>
        <ng-template #errorTpl>
          <div class="error-icon">❌</div>
          <h2>Đăng nhập thất bại</h2>
          <p>{{ error }}</p>
          <button class="btn-retry" (click)="goToLogin()">Thử lại</button>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .callback-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0d1117 100%);
    }
    .callback-card {
      text-align: center;
      padding: 3rem;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 20px;
      backdrop-filter: blur(20px);
    }
    .logo { font-size: 3rem; margin-bottom: 1rem; }
    h2 { color: #f0f6fc; font-size: 1.5rem; margin: 1rem 0 0.5rem; }
    p { color: #8b949e; }
    .spinner {
      width: 40px; height: 40px;
      border: 3px solid rgba(255,255,255,0.1);
      border-top-color: #f0b429;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 1rem auto;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error-icon { font-size: 2.5rem; margin: 1rem 0; }
    .btn-retry {
      margin-top: 1rem;
      padding: 0.6rem 1.5rem;
      background: #f0b429;
      color: #0d1117;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
    }
  `]
})
export class CallbackComponent implements OnInit {
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const code = this.route.snapshot.queryParamMap.get('code');
    if (!code) {
      this.error = 'Không tìm thấy authorization code';
      return;
    }

    this.authService.handleCallback(code).subscribe({
      next: () => {
        this.router.navigate(['/home']);
      },
      error: (err) => {
        console.error('Auth error:', err);
        this.error = err.error?.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
