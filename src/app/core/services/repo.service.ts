import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PageResponse, Repo } from '../models/models';

export interface BulkStarResult {
  success: number;
  failed: number;
  skipped: number;
  creditsChanged: number;
}

@Injectable({
  providedIn: 'root'
})
export class RepoService {
  private apiUrl = `${environment.apiUrl}/repos`;

  constructor(private http: HttpClient) {}

  getRepos(page = 0, size = 12): Observable<PageResponse<Repo>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<Repo>>(this.apiUrl, { params });
  }

  addRepo(fullName: string, description?: string): Observable<Repo> {
    return this.http.post<Repo>(this.apiUrl, { fullName, description });
  }

  starRepo(id: number): Observable<Repo> {
    return this.http.post<Repo>(`${this.apiUrl}/${id}/star`, {});
  }

  unstarRepo(id: number): Observable<Repo> {
    return this.http.delete<Repo>(`${this.apiUrl}/${id}/star`);
  }

  getStarStatus(id: number): Observable<{ starred: boolean }> {
    return this.http.get<{ starred: boolean }>(`${this.apiUrl}/${id}/star-status`);
  }

  importMine(): Observable<BulkStarResult> {
    return this.http.post<BulkStarResult>(`${this.apiUrl}/import-mine`, {});
  }

  starAll(): Observable<BulkStarResult> {
    return this.http.post<BulkStarResult>(`${this.apiUrl}/star-all`, {});
  }

  unstarAll(): Observable<BulkStarResult> {
    return this.http.post<BulkStarResult>(`${this.apiUrl}/unstar-all`, {});
  }

  deleteMine(): Observable<BulkStarResult> {
    return this.http.delete<BulkStarResult>(`${this.apiUrl}/delete-mine`);
  }
}
