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
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  host: { '[class.dark]': 'darkMode' }
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
  apiLoading = 0;
  darkMode = false;

  toggleTheme() {
    this.darkMode = !this.darkMode;
    localStorage.setItem('starboard-theme', this.darkMode ? 'dark' : 'light');
  }

  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private readonly POLL_MS = 10_000;

  constructor(
    private repoService: RepoService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.darkMode = localStorage.getItem('starboard-theme') === 'dark';
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    this.loadRepos();
    this.pollInterval = setInterval(() => this.silentRefresh(), this.POLL_MS);
  }

  ngOnDestroy() {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  private silentRefresh() {
    this.repoService.getRepos(this.currentPage, 12).subscribe({
      next: (data) => {
        this.repos = data.content;
        this.totalPages = data.totalPages;
        this.totalRepos = data.totalElements;
      },
      error: () => {}
    });
    this.authService.getMe().subscribe({
      next: (user) => { this.currentUser = user; },
      error: () => {}
    });
  }

  loadRepos() {
    this.loading = true;
    this.apiLoading++;
    this.repoService.getRepos(this.currentPage, 12).subscribe({
      next: (data) => {
        this.repos = data.content;
        this.totalPages = data.totalPages;
        this.totalRepos = data.totalElements;
        this.loading = false;
        this.apiLoading--;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.apiLoading--;
        this.showToast('Lỗi tải danh sách repo', 'error');
      }
    });
  }

  toggleStar(repo: Repo) {
    if (!this.currentUser) {
      this.showToast('Vui lòng đăng nhập để star repo', 'error');
      return;
    }
    if (this.isOwnRepo(repo)) {
      this.showToast('Bạn không thể tự star repo của chính mình!', 'error');
      return;
    }
    if (!repo.canStar && !repo.starred) {
      this.showToast('Chủ repo đã hết credit — họ cần star repo khác trước!', 'error');
      return;
    }
    this.starLoading[repo.id] = true;
    this.apiLoading++;

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
        this.apiLoading--;
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
        this.apiLoading--;
        this.showToast(err.error?.message || 'Lỗi khi star repo. Vui lòng thử lại.', 'error');
      }
    });
  }

  getBulkLoadingText(): string {
    switch (this.bulkLoading) {
      case 'star': return '⭐ Đang star tất cả repo...';
      case 'unstar': return '☆ Đang bỏ star tất cả...';
      case 'import': return '🐙 Đang import repo từ GitHub...';
      case 'delete': return '🗑️ Đang xóa repo...';
      default: return 'Đang xử lý...';
    }
  }

  importMine() {
    if (this.bulkLoading) return;
    this.bulkLoading = 'import';
    this.repoService.importMine().subscribe({
      next: (result: BulkStarResult) => {
        this.bulkLoading = null;
        this.loadRepos();
        const msg = result.success > 0
          ? `🐙 Đã import thành công ${result.success} repo!` + (result.skipped > 0 ? ` (Bỏ qua ${result.skipped})` : '')
          : `Không tìm thấy repo mới (bỏ qua: ${result.skipped})`;
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
    if (!confirm('Bạn có chắc muốn xoá TẤT CẢ repo của mình?')) return;
    this.bulkLoading = 'delete';
    this.repoService.deleteMine().subscribe({
      next: (result: BulkStarResult) => {
        this.bulkLoading = null;
        this.loadRepos();
        const msg = result.success > 0
          ? `🗑️ Đã xoá ${result.success} repo!`
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

  isOwnRepo(repo: Repo): boolean {
    return !!this.currentUser && repo.owner === this.currentUser.login;
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
    return colors[lang] || '#a855f7';
  }

  private showToast(msg: string, type: 'success' | 'error') {
    this.toast = msg;
    this.toastType = type;
    setTimeout(() => { this.toast = null; }, 3500);
  }
}
