import { AccountStatus, MessagePrivacy, UserRole } from './auth';

export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  bannedUsers: number;
  totalMessages: number;
  totalConversations: number;
  pendingReports: number;
  resolvedReports: number;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  role: UserRole;
  accountStatus: AccountStatus;
  messagePrivacy: MessagePrivacy;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminUsername: string;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}
