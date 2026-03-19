import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="login-container">
      <div class="bg-grid"></div>
      <div class="glow glow-1"></div>
      <div class="glow glow-2"></div>

      <div class="login-card">
        <div class="brand">
          <span class="brand-icon">⭐</span>
          <h1>StarBoard</h1>
        </div>
        <p class="tagline">Cộng đồng Dev Việt Nam — Star GitHub repo của nhau</p>

        <div class="features">
          <div class="feature-item">
            <span>🚀</span>
            <span>Khám phá repo VN chất lượng cao</span>
          </div>
          <div class="feature-item">
            <span>⭐</span>
            <span>Star trực tiếp không cần mở GitHub</span>
          </div>
          <div class="feature-item">
            <span>👥</span>
            <span>Kết nối cộng đồng dev Việt Nam</span>
          </div>
        </div>

        <button class="btn-github" (click)="login()" [disabled]="loading">
          <span *ngIf="!loading">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            Đăng nhập với GitHub
          </span>
          <span *ngIf="loading" class="spinner-sm"></span>
        </button>

        <p class="hint">Bằng cách đăng nhập, bạn cho phép StarBoard star repo thay mặt bạn</p>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0d1117;
      position: relative;
      overflow: hidden;
    }
    .bg-grid {
      position: absolute; inset: 0;
      background-image: linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px);
      background-size: 50px 50px;
    }
    .glow {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      pointer-events: none;
    }
    .glow-1 {
      width: 400px; height: 400px;
      background: rgba(240, 180, 41, 0.15);
      top: -100px; left: -100px;
    }
    .glow-2 {
      width: 500px; height: 500px;
      background: rgba(88, 166, 255, 0.1);
      bottom: -150px; right: -150px;
    }
    .login-card {
      position: relative; z-index: 1;
      width: 440px;
      padding: 3rem;
      background: rgba(22, 27, 34, 0.9);
      border: 1px solid rgba(48, 54, 61, 0.8);
      border-radius: 24px;
      backdrop-filter: blur(20px);
      box-shadow: 0 25px 50px rgba(0,0,0,0.5);
      text-align: center;
    }
    .brand {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 0.75rem;
    }
    .brand-icon { font-size: 2.5rem; }
    .brand h1 {
      font-size: 2.2rem;
      font-weight: 800;
      background: linear-gradient(135deg, #f0b429, #ffd770);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin: 0;
    }
    .tagline {
      color: #8b949e;
      font-size: 0.95rem;
      margin-bottom: 2rem;
    }
    .features {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 2rem;
      text-align: left;
    }
    .feature-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: rgba(255,255,255,0.03);
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.06);
      color: #c9d1d9;
      font-size: 0.9rem;
    }
    .feature-item span:first-child { font-size: 1.2rem; }
    .btn-github {
      width: 100%;
      padding: 0.9rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      background: linear-gradient(135deg, #2d333b, #3d444d);
      color: #f0f6fc;
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-bottom: 1rem;
    }
    .btn-github:hover:not(:disabled) {
      background: linear-gradient(135deg, #3d444d, #4d535d);
      border-color: rgba(255,255,255,0.3);
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.3);
    }
    .btn-github:disabled { opacity: 0.6; cursor: not-allowed; }
    .spinner-sm {
      width: 20px; height: 20px;
      border: 2px solid rgba(255,255,255,0.2);
      border-top-color: #f0b429;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .hint { color: #484f58; font-size: 0.78rem; line-height: 1.5; }
  `]
})
export class LoginComponent {
  loading = false;

  constructor(private authService: AuthService) {}

  login() {
    this.loading = true;
    this.authService.getLoginUrl().subscribe({
      next: (res) => {
        window.location.href = res.loginUrl;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }
}
