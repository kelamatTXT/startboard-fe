import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { RepoService, BulkStarResult } from '../../core/services/repo.service';
import { AuthService } from '../../core/services/auth.service';
import { Repo, User, PageResponse } from '../../core/models/models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <!-- Navbar -->
    <nav class="navbar">
      <div class="nav-brand">
        <span class="nav-icon">⭐</span>
        <span class="nav-title">StarBoard</span>
        <span class="nav-badge">VN Dev Community</span>
      </div>
      <div class="nav-right" *ngIf="currentUser">
        <div class="credit-badge" [class.low]="currentUser.credits <= 3" [title]="'Credit: ' + currentUser.credits + ' (star người khác để tăng)'">
          💰 {{ currentUser.credits }} credits
        </div>
        <div class="user-info">
          <img [src]="currentUser.avatarUrl" [alt]="currentUser.login" class="avatar">
          <span class="username">{{ currentUser.name || currentUser.login }}</span>
        </div>
        <button class="btn-logout" (click)="logout()">Đăng xuất</button>
      </div>
    </nav>

    <!-- Hero -->
    <section class="hero">
      <div class="hero-glow"></div>
      <div class="hero-glow-2"></div>
      <h1>Khám phá & Star <span class="hero-highlight">Repo VN</span></h1>
      <p>Star trực tiếp các GitHub repo của cộng đồng dev Việt Nam — không cần rời trang!</p>
      <div class="hero-stats">
        <div class="stat">
          <span class="stat-number">{{ totalRepos }}</span>
          <span class="stat-label">Repos</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat">
          <span class="stat-number">{{ currentUser?.credits || 0 }}</span>
          <span class="stat-label">Credits</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat">
          <span class="stat-number">⭐</span>
          <span class="stat-label">Star ngay</span>
        </div>
      </div>
    </section>

    <!-- Action Bar -->
    <div class="action-bar" *ngIf="currentUser">
      <div class="action-group">
        <span class="action-group-label">📦 Quản lý Repo</span>
        <div class="action-buttons">
          <button class="action-btn primary" (click)="showAddModal = true">
            <span class="action-icon">➕</span> Thêm Repo
          </button>
          <button class="action-btn dark" (click)="importMine()" [disabled]="!!bulkLoading">
            <span class="action-icon">🐙</span>
            {{ bulkLoading === 'import' ? 'Đang import...' : 'Import My Repos' }}
          </button>
          <button class="action-btn danger-subtle" (click)="deleteMine()" [disabled]="!!bulkLoading">
            <span class="action-icon">🗑️</span>
            {{ bulkLoading === 'delete' ? 'Đang xoá...' : 'Xoá My Repos' }}
          </button>
        </div>
      </div>
      <div class="action-group">
        <span class="action-group-label">⭐ Hành động Star</span>
        <div class="action-buttons">
          <button class="action-btn success" (click)="starAll()" [disabled]="!!bulkLoading">
            <span class="action-icon">★</span>
            {{ bulkLoading === 'star' ? 'Đang star...' : 'Star All' }}
          </button>
          <button class="action-btn danger" (click)="unstarAll()" [disabled]="!!bulkLoading">
            <span class="action-icon">☆</span>
            {{ bulkLoading === 'unstar' ? 'Đang unstar...' : 'Unstar All' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Repo Grid -->
    <main class="main-content">
      <div *ngIf="loading" class="repos-grid">
        <div *ngFor="let i of [1,2,3,4,5,6]" class="repo-card skeleton-card">
          <div class="skeleton skeleton-avatar"></div>
          <div class="skeleton skeleton-title"></div>
          <div class="skeleton skeleton-desc"></div>
          <div class="skeleton skeleton-meta"></div>
        </div>
      </div>
      <div *ngIf="!loading" class="repos-grid">
        <div *ngFor="let repo of repos; let i = index" class="repo-card" [class.starred]="repo.starred" [style.animation-delay]="i * 0.06 + 's'">
          <div class="card-ribbon" *ngIf="repo.starred">⭐ Đã Star</div>
          <div class="card-star-count">
            <span class="star-count-icon">★</span>
            <span>{{ formatNumber(repo.stargazersCount) }}</span>
          </div>
          <div class="card-header">
            <img [src]="repo.avatarUrl || 'https://github.com/identicons/' + repo.owner + '.png'" [alt]="repo.owner" class="repo-avatar">
            <div class="repo-info">
              <a [href]="repo.htmlUrl" target="_blank" class="repo-full-name">{{ repo.owner }}<span class="slash">/</span>{{ repo.name }}</a>
              <span class="repo-owner">&#64;{{ repo.owner }}</span>
            </div>
          </div>
          <p class="repo-desc">{{ repo.description || 'Chưa có mô tả' }}</p>
          <div class="card-meta">
            <span *ngIf="repo.language" class="lang-badge" [attr.data-lang]="repo.language">
              <span class="lang-dot" [style.background]="getLangColor(repo.language)"></span> {{ repo.language }}
            </span>
            <span class="community-stars" *ngIf="repo.communityStars > 0">👥 {{ repo.communityStars }} cộng đồng</span>
          </div>
          <button class="btn-star" [class.starred]="repo.starred" [class.loading]="starLoading[repo.id]" [class.no-credit]="!repo.canStar && !repo.starred"
            (click)="toggleStar(repo)" [disabled]="!currentUser || starLoading[repo.id] || (!repo.canStar && !repo.starred)"
            [title]="!repo.canStar && !repo.starred ? 'Chủ repo đã hết credit' : ''">
            <span class="star-icon">{{ repo.starred ? '★' : '☆' }}</span>
            <span>{{ !repo.canStar && !repo.starred ? '🚫 Hết credit' : (repo.starred ? 'Đã Star' : 'Star') }}</span>
          </button>
        </div>
      </div>
      <div class="pagination" *ngIf="!loading && totalPages > 1">
        <button [disabled]="currentPage === 0" (click)="changePage(currentPage - 1)" class="page-btn">← Trước</button>
        <span class="page-info">{{ currentPage + 1 }} / {{ totalPages }}</span>
        <button [disabled]="currentPage >= totalPages - 1" (click)="changePage(currentPage + 1)" class="page-btn">Sau →</button>
      </div>
    </main>

    <!-- Toast -->
    <div class="toast" *ngIf="toast" [class.error]="toastType === 'error'" [class.show]="toast">{{ toast }}</div>

    <!-- Add Repo Modal -->
    <div class="modal-overlay" *ngIf="showAddModal" (click)="closeModal($event)">
      <div class="modal">
        <h3>Thêm Repository</h3>
        <p>Nhập tên repo theo định dạng <code>owner/repo</code></p>
        <input [(ngModel)]="newRepoName" placeholder="vd: angular/angular" class="modal-input" (keyup.enter)="addRepo()">
        <textarea [(ngModel)]="newRepoDesc" placeholder="Mô tả (tuỳ chọn — mặc định lấy từ GitHub)" class="modal-input modal-textarea" rows="3"></textarea>
        <div class="modal-actions">
          <button class="btn-cancel" (click)="showAddModal = false">Hủy</button>
          <button class="btn-confirm" (click)="addRepo()" [disabled]="!newRepoName.trim() || addingRepo">
            {{ addingRepo ? 'Đang thêm...' : 'Thêm' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    * { box-sizing: border-box; }
    .navbar { position: sticky; top: 0; z-index: 100; display: flex; align-items: center; justify-content: space-between; padding: 0 2rem; height: 62px; background: rgba(255,255,255,0.85); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(208,215,222,0.6); box-shadow: 0 1px 8px rgba(0,0,0,0.04); }
    .nav-brand { display: flex; align-items: center; gap: 10px; }
    .nav-icon { font-size: 1.5rem; filter: drop-shadow(0 2px 4px rgba(240,180,41,0.3)); }
    .nav-title { font-size: 1.25rem; font-weight: 800; background: linear-gradient(135deg, #f0b429, #e3810a); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .nav-badge { font-size: 0.65rem; padding: 2px 8px; background: linear-gradient(135deg, #fff8e7, #fff0d0); border: 1px solid #f0b429; border-radius: 20px; color: #d4800a; font-weight: 700; letter-spacing: 0.3px; }
    .nav-right { display: flex; align-items: center; gap: 1rem; }
    .user-info { display: flex; align-items: center; gap: 0.5rem; }
    .avatar { width: 34px; height: 34px; border-radius: 50%; border: 2px solid #f0b429; box-shadow: 0 2px 8px rgba(240,180,41,0.2); transition: transform 0.2s; }
    .avatar:hover { transform: scale(1.1); }
    .username { color: #24292f; font-size: 0.88rem; font-weight: 600; }
    .credit-badge { display: inline-flex; align-items: center; padding: 4px 12px; background: linear-gradient(135deg, #fff8e7, #fff0d0); border: 1px solid #f0b429; border-radius: 20px; font-size: 0.78rem; font-weight: 700; color: #d4800a; cursor: help; transition: all 0.2s; }
    .credit-badge:hover { box-shadow: 0 2px 12px rgba(240,180,41,0.25); }
    .credit-badge.low { background: linear-gradient(135deg, #fff0ed, #ffe0db); border-color: #f85149; color: #cf222e; animation: pulse-low 2s infinite; }
    @keyframes pulse-low { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
    .btn-logout { padding: 0.4rem 0.9rem; background: transparent; border: 1px solid #d0d7de; color: #57606a; border-radius: 8px; cursor: pointer; font-size: 0.82rem; font-weight: 500; transition: all 0.2s; }
    .btn-logout:hover { border-color: #cf222e; color: #cf222e; background: #fff0ed; }

    .hero { position: relative; text-align: center; padding: 3rem 2rem 2.5rem; background: linear-gradient(180deg, #0d1117 0%, #161b22 50%, #1c2333 100%); overflow: hidden; }
    .hero-glow { position: absolute; top: -100px; left: 30%; width: 600px; height: 300px; background: radial-gradient(ellipse, rgba(240,180,41,0.15) 0%, transparent 70%); animation: float 8s ease-in-out infinite; }
    .hero-glow-2 { position: absolute; top: -50px; right: 10%; width: 400px; height: 250px; background: radial-gradient(ellipse, rgba(14,117,220,0.1) 0%, transparent 70%); animation: float 10s ease-in-out infinite reverse; }
    @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
    .hero h1 { font-size: 2.6rem; font-weight: 900; color: #f0f6fc; margin: 0 0 0.8rem; position: relative; z-index: 1; letter-spacing: -0.5px; }
    .hero-highlight { background: linear-gradient(135deg, #f0b429, #ff6b35); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .hero p { color: #8b949e; font-size: 1.05rem; max-width: 520px; margin: 0 auto 2rem; position: relative; z-index: 1; line-height: 1.6; }
    .hero-stats { display: inline-flex; align-items: center; gap: 2rem; padding: 1rem 2.5rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; position: relative; z-index: 1; backdrop-filter: blur(10px); }
    .stat { text-align: center; }
    .stat-number { display: block; font-size: 1.5rem; font-weight: 800; color: #f0b429; }
    .stat-label { font-size: 0.78rem; color: #8b949e; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-divider { width: 1px; height: 36px; background: rgba(255,255,255,0.1); }

    .action-bar { display: flex; align-items: center; justify-content: center; gap: 2.5rem; flex-wrap: wrap; padding: 1.2rem 2rem; background: #f6f8fa; border-bottom: 1px solid #d0d7de; }
    .action-group { display: flex; align-items: center; gap: 0.6rem; }
    .action-group-label { font-size: 0.75rem; font-weight: 700; color: #57606a; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; }
    .action-buttons { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .action-btn { display: inline-flex; align-items: center; gap: 6px; padding: 0.5rem 1rem; border: none; border-radius: 10px; font-weight: 700; font-size: 0.8rem; cursor: pointer; transition: all 0.25s; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .action-btn:hover:not([disabled]) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .action-btn:active:not([disabled]) { transform: translateY(0); }
    .action-btn[disabled] { opacity: 0.5; cursor: not-allowed; }
    .action-icon { font-size: 0.95rem; }
    .action-btn.primary { background: linear-gradient(135deg, #f0b429, #e3810a); color: #fff; }
    .action-btn.dark { background: linear-gradient(135deg, #24292f, #1a1e24); color: #fff; }
    .action-btn.success { background: linear-gradient(135deg, #1f883d, #17713a); color: #fff; }
    .action-btn.danger { background: linear-gradient(135deg, #cf222e, #a40e26); color: #fff; }
    .action-btn.danger-subtle { background: #fff; color: #cf222e; border: 1px solid #f1b8b8; }
    .action-btn.danger-subtle:hover:not([disabled]) { background: #fff0ed; border-color: #cf222e; }

    .main-content { max-width: 1300px; margin: 0 auto; padding: 2rem; }
    .repos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.4rem; }
    .repo-card { position: relative; background: #ffffff; border: 1px solid #e1e4e8; border-radius: 16px; padding: 1.5rem; padding-top: 1.8rem; display: flex; flex-direction: column; gap: 0.9rem; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); animation: fadeInUp 0.5s ease forwards; opacity: 0; overflow: hidden; }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
    .repo-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #e1e4e8, #e1e4e8); transition: all 0.3s; }
    .repo-card:hover::before { background: linear-gradient(90deg, #f0b429, #ff6b35, #0969da); }
    .repo-card:hover { border-color: transparent; box-shadow: 0 12px 32px rgba(0,0,0,0.1); transform: translateY(-4px); }
    .repo-card.starred { border-color: #f0b429; background: linear-gradient(135deg, #fffcf0, #fff8e7); }
    .repo-card.starred::before { background: linear-gradient(90deg, #f0b429, #ff6b35); }

    .card-ribbon { position: absolute; top: 12px; left: -32px; background: linear-gradient(135deg, #f0b429, #e3810a); color: #fff; font-size: 0.65rem; font-weight: 800; padding: 3px 36px; transform: rotate(-45deg); box-shadow: 0 2px 6px rgba(240,180,41,0.3); letter-spacing: 0.5px; z-index: 2; }
    .card-star-count { position: absolute; top: 12px; right: 12px; display: flex; align-items: center; gap: 3px; background: linear-gradient(135deg, #161b22, #24292f); color: #f0b429; padding: 4px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 800; box-shadow: 0 2px 8px rgba(0,0,0,0.15); z-index: 2; }
    .star-count-icon { font-size: 0.85rem; }

    .card-header { display: flex; align-items: center; gap: 12px; }
    .repo-avatar { width: 44px; height: 44px; border-radius: 12px; border: 2px solid #e1e4e8; transition: all 0.3s; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .repo-card:hover .repo-avatar { transform: scale(1.08) rotate(-2deg); border-color: #f0b429; box-shadow: 0 4px 12px rgba(240,180,41,0.2); }
    .repo-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .repo-full-name { color: #0969da; text-decoration: none; font-weight: 700; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: color 0.2s; }
    .repo-full-name:hover { color: #0550ae; text-decoration: underline; }
    .slash { color: #8b949e; font-weight: 400; }
    .repo-owner { color: #8b949e; font-size: 0.75rem; }
    .repo-desc { color: #57606a; font-size: 0.88rem; line-height: 1.55; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin: 0; flex: 1; }
    .card-meta { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }
    .lang-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 0.75rem; color: #24292f; font-weight: 600; background: #f6f8fa; padding: 3px 10px; border-radius: 20px; border: 1px solid #e1e4e8; }
    .lang-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
    .community-stars { font-size: 0.73rem; color: #57606a; background: #f6f8fa; border: 1px solid #e1e4e8; padding: 3px 10px; border-radius: 20px; font-weight: 600; }

    .btn-star { width: 100%; padding: 0.65rem; display: flex; align-items: center; justify-content: center; gap: 8px; background: #f6f8fa; border: 1px solid #e1e4e8; border-radius: 10px; color: #24292f; font-size: 0.88rem; font-weight: 600; cursor: pointer; transition: all 0.25s; }
    .btn-star:hover:not(:disabled) { background: linear-gradient(135deg, #fff8e7, #fff0d0); border-color: #f0b429; color: #d4800a; box-shadow: 0 2px 8px rgba(240,180,41,0.15); }
    .btn-star.starred { background: linear-gradient(135deg, #fff8e7, #fff0d0); border-color: #f0b429; color: #d4800a; }
    .btn-star:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-star.loading { opacity: 0.7; }
    .btn-star.no-credit { background: #fff0ed; border-color: #f1b8b8; color: #afb8c1; cursor: not-allowed; }
    .star-icon { font-size: 1.15rem; transition: transform 0.2s; }
    .btn-star:hover:not(:disabled) .star-icon { transform: scale(1.3) rotate(15deg); }

    .skeleton-card { animation: shimmer 1.5s infinite; }
    .skeleton { background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; border-radius: 8px; animation: shimmer 1.5s infinite; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    .skeleton-avatar { width: 42px; height: 42px; border-radius: 10px; margin-bottom: 12px; }
    .skeleton-title { height: 18px; width: 70%; margin-bottom: 8px; }
    .skeleton-desc { height: 14px; width: 90%; margin-bottom: 6px; }
    .skeleton-meta { height: 14px; width: 50%; }

    .pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 3rem; padding-bottom: 2rem; }
    .page-btn { padding: 0.55rem 1.4rem; background: #ffffff; border: 1px solid #e1e4e8; border-radius: 10px; color: #24292f; cursor: pointer; transition: all 0.2s; font-weight: 500; }
    .page-btn:hover:not(:disabled) { background: #f6f8fa; border-color: #f0b429; color: #d4800a; }
    .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .page-info { color: #8b949e; font-size: 0.9rem; font-weight: 500; }

    .toast { position: fixed; bottom: 2rem; right: 2rem; padding: 0.9rem 1.6rem; background: linear-gradient(135deg, #1a7f37, #17713a); color: #fff; border-radius: 12px; font-size: 0.88rem; font-weight: 600; transform: translateY(100px); opacity: 0; transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 8px 24px rgba(0,0,0,0.2); z-index: 999; }
    .toast.error { background: linear-gradient(135deg, #cf222e, #a40e26); }
    .toast.show { transform: translateY(0); opacity: 1; }

    .modal-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; }
    .modal { width: 460px; padding: 2rem; background: #ffffff; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.25); animation: modalIn 0.3s ease; }
    @keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    .modal h3 { color: #24292f; font-size: 1.25rem; margin: 0 0 0.5rem; font-weight: 800; }
    .modal p { color: #57606a; font-size: 0.9rem; margin: 0 0 1.5rem; }
    .modal code { background: #f6f8fa; padding: 2px 6px; border: 1px solid #e1e4e8; border-radius: 4px; color: #d4800a; font-size: 0.85rem; }
    .modal-input { width: 100%; padding: 0.75rem 1rem; background: #ffffff; border: 1px solid #e1e4e8; border-radius: 10px; color: #24292f; font-size: 0.95rem; outline: none; margin-bottom: 1rem; font-family: inherit; transition: all 0.2s; }
    .modal-input:focus { border-color: #f0b429; box-shadow: 0 0 0 3px rgba(240,180,41,0.15); }
    .modal-input::placeholder { color: #afb8c1; }
    .modal-textarea { resize: vertical; min-height: 80px; margin-bottom: 1.5rem; }
    .modal-actions { display: flex; gap: 0.75rem; justify-content: flex-end; }
    .btn-cancel { padding: 0.6rem 1.2rem; background: #f6f8fa; border: 1px solid #e1e4e8; border-radius: 10px; color: #57606a; cursor: pointer; font-weight: 500; transition: all 0.2s; }
    .btn-cancel:hover { background: #e1e4e8; }
    .btn-confirm { padding: 0.6rem 1.5rem; background: linear-gradient(135deg, #f0b429, #e3810a); border: none; border-radius: 10px; color: #ffffff; font-weight: 700; cursor: pointer; transition: all 0.2s; }
    .btn-confirm:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-confirm:hover:not(:disabled) { box-shadow: 0 4px 12px rgba(240,180,41,0.35); transform: translateY(-1px); }
  `]
})
export class HomeComponent implements OnInit, OnDestroy {
  repos: Repo[] = [];
  currentUser: User | null = null;
  loading = true;
  starLoading: { [key: number]: boolean } = {};
  currentPage = 0;
  totalPages = 0;
  totalRepos = 0;
  toast: string | null = null;
  toastType: 'success' | 'error' = 'success';
  showAddModal = false;
  newRepoName = '';
  newRepoDesc = '';
  addingRepo = false;
  bulkLoading: 'star' | 'unstar' | 'import' | 'delete' | null = null;

  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private readonly POLL_MS = 10_000; // 10 giây

  constructor(
    private repoService: RepoService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    this.loadRepos();
    // Polling: đồng bộ trạng thái star từ backend mỗi 10 giây
    this.pollInterval = setInterval(() => this.silentRefresh(), this.POLL_MS);
  }

  ngOnDestroy() {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  /** Refresh nhẹ — không bật loading skeleton, không reset trang */
  private silentRefresh() {
    this.repoService.getRepos(this.currentPage, 12).subscribe({
      next: (data) => {
        this.repos = data.content;
        this.totalPages = data.totalPages;
        this.totalRepos = data.totalElements;
      },
      error: () => {}
    });
    // Refresh credit trực tiếp từ /auth/me → cập nhật ngay this.currentUser
    this.authService.getMe().subscribe({
      next: (user) => { this.currentUser = user; },
      error: () => {}
    });
  }

  loadRepos() {
    this.loading = true;
    this.repoService.getRepos(this.currentPage, 12).subscribe({
      next: (data) => {
        this.repos = data.content;
        this.totalPages = data.totalPages;
        this.totalRepos = data.totalElements;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.showToast('Lỗi tải danh sách repo', 'error');
      }
    });
  }

  toggleStar(repo: Repo) {
    if (!this.currentUser) {
      this.showToast('Vui lòng đăng nhập để star repo', 'error');
      return;
    }
    if (!repo.canStar && !repo.starred) {
      this.showToast('Chủ repo đã hết credit — họ cần star repo khác trước!', 'error');
      return;
    }
    this.starLoading[repo.id] = true;

    const action$ = repo.starred
      ? this.repoService.unstarRepo(repo.id)
      : this.repoService.starRepo(repo.id);

    action$.subscribe({
      next: (updated) => {
        const index = this.repos.findIndex(r => r.id === repo.id);
        if (index !== -1) {
          this.repos[index] = updated;
        }
        this.starLoading[repo.id] = false;

        // Gọi getMe() để lấy credit thực từ server (không tự tính local dễ bị lệch)
        this.authService.getMe().subscribe({
          next: (user) => { this.currentUser = user; },
          error: () => {}
        });

        const msg = updated.starred
          ? `⭐ Đã star ${repo.fullName}! (+1 credit)`
          : `Đã bỏ star ${repo.fullName} (-1 credit)`;
        this.showToast(msg, 'success');
      },
      error: (err) => {
        console.error(err);
        this.starLoading[repo.id] = false;
        this.showToast(err.error?.message || 'Lỗi khi star repo. Vui lòng thử lại.', 'error');
      }
    });
  }

  importMine() {
    if (this.bulkLoading) return;
    this.bulkLoading = 'import';
    this.repoService.importMine().subscribe({
      next: (result: BulkStarResult) => {
        this.bulkLoading = null;
        this.loadRepos();
        const msg = result.success > 0
          ? `🐙 Đã import thành công ${result.success} repo của bạn!` + (result.skipped > 0 ? ` (Bỏ qua ${result.skipped} repo đã có)` : '')
          : `Không tìm thấy repo mới nào để import (bỏ qua: ${result.skipped})`;
        this.showToast(msg, result.success > 0 ? 'success' : 'error');
      },
      error: (err) => {
        this.bulkLoading = null;
        this.showToast(err.error?.message || 'Lỗi khi import repo', 'error');
      }
    });
  }

  deleteMine() {
    if (this.bulkLoading) return;
    if (!confirm('Bạn có chắc chắn muốn xoá TẤT CẢ repo của mình khỏi hệ thống? Hành động này không thể hoàn tác!')) return;
    this.bulkLoading = 'delete';
    this.repoService.deleteMine().subscribe({
      next: (result: BulkStarResult) => {
        this.bulkLoading = null;
        this.loadRepos();
        const msg = result.success > 0
          ? `🗑️ Đã xoá ${result.success} repo của bạn!`
          : 'Không tìm thấy repo nào để xoá';
        this.showToast(msg, result.success > 0 ? 'success' : 'error');
      },
      error: (err) => {
        this.bulkLoading = null;
        this.showToast(err.error?.message || 'Lỗi khi xoá repo', 'error');
      }
    });
  }

  addRepo() {
    const fullName = this.newRepoName.trim();
    if (!fullName || !fullName.includes('/')) {
      this.showToast('Tên repo phải có dạng owner/repo', 'error');
      return;
    }
    this.addingRepo = true;
    const desc = this.newRepoDesc.trim() || undefined;
    this.repoService.addRepo(fullName, desc).subscribe({
      next: (repo) => {
        this.repos.unshift(repo);
        this.totalRepos++;
        this.addingRepo = false;
        this.showAddModal = false;
        this.newRepoName = '';
        this.newRepoDesc = '';
        this.showToast(`✅ Đã thêm ${fullName}!`, 'success');
      },
      error: (err) => {
        this.addingRepo = false;
        this.showToast(err.error?.message || 'Lỗi thêm repo', 'error');
      }
    });
  }

  starAll() {
    if (this.bulkLoading) return;
    this.bulkLoading = 'star';
    this.repoService.starAll().subscribe({
      next: (result: BulkStarResult) => {
        this.bulkLoading = null;
        // Refresh lại danh sách và credit
        this.loadRepos();
        this.authService.getMe().subscribe({ next: (u) => { this.currentUser = u; }, error: () => {} });
        const msg = result.success > 0
          ? `⭐ Đã star ${result.success} repo! (+${result.creditsChanged} credit)` + (result.skipped > 0 ? ` • Bỏ qua ${result.skipped}` : '')
          : `Không có repo nào để star (bỏ qua: ${result.skipped})`;
        this.showToast(msg, result.success > 0 ? 'success' : 'error');
      },
      error: (err) => {
        this.bulkLoading = null;
        this.showToast(err.error?.message || 'Lỗi khi star all', 'error');
      }
    });
  }

  unstarAll() {
    if (this.bulkLoading) return;
    this.bulkLoading = 'unstar';
    this.repoService.unstarAll().subscribe({
      next: (result: BulkStarResult) => {
        this.bulkLoading = null;
        this.loadRepos();
        this.authService.getMe().subscribe({ next: (u) => { this.currentUser = u; }, error: () => {} });
        const msg = result.success > 0
          ? `✅ Đã unstar ${result.success} repo (${result.creditsChanged} credit)`
          : 'Không có repo nào đang star';
        this.showToast(msg, result.success > 0 ? 'success' : 'error');
      },
      error: (err) => {
        this.bulkLoading = null;
        this.showToast(err.error?.message || 'Lỗi khi unstar all', 'error');
      }
    });
  }

  changePage(page: number) {
    this.currentPage = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.loadRepos();
  }

  logout() {
    this.authService.logout();
  }

  closeModal(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.showAddModal = false;
    }
  }

  formatNumber(num: number): string {
    if (!num) return '0';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  }

  getLangColor(lang: string): string {
    const colors: { [key: string]: string } = {
      'JavaScript': '#f1e05a', 'TypeScript': '#3178c6', 'Python': '#3572A5',
      'Java': '#b07219', 'Go': '#00ADD8', 'Rust': '#dea584',
      'C++': '#f34b7d', 'C#': '#178600', 'C': '#555555',
      'PHP': '#4F5D95', 'Ruby': '#701516', 'Swift': '#F05138',
      'Kotlin': '#A97BFF', 'Dart': '#00B4AB', 'Scala': '#c22d40',
      'HTML': '#e34c26', 'CSS': '#563d7c', 'Shell': '#89e051',
      'Vue': '#41b883', 'Lua': '#000080', 'Elixir': '#6e4a7e',
    };
    return colors[lang] || '#f0b429';
  }

  private showToast(msg: string, type: 'success' | 'error') {
    this.toast = msg;
    this.toastType = type;
    setTimeout(() => { this.toast = null; }, 3500);
  }
}
