export interface User {
  id: number;
  login: string;
  name: string;
  avatarUrl: string;
  email: string;
  credits: number; // Số credit hiện tại
}

export interface Repo {
  id: number;
  owner: string;
  name: string;
  fullName: string;
  description: string;
  language: string;
  stargazersCount: number;
  communityStars: number;
  htmlUrl: string;
  avatarUrl: string;
  starred: boolean;
  canStar: boolean; // false nếu owner hết credit
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  user: User;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  last: boolean;
}
