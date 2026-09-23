export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'DELETED';
export type MessagePrivacy = 'EVERYONE' | 'FRIENDS_ONLY';

export interface UserSummary {
  id: string;
  username: string;
  email: string;
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  accountStatus: AccountStatus;
  messagePrivacy: MessagePrivacy;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInMs: number;
  user: UserSummary;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errorCode?: string;
  errors?: string[];
  timestamp: string;
}
