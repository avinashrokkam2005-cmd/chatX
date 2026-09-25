import api from '../../../services/api';
import { ApiResponse } from '../../../types/auth';
import { AdminDashboardStats, AdminUser, AuditLog } from '../../../types/admin';
import { ReportDto, ReportStatus } from '../../../types/report';

export interface AdminUsersQuery {
  query?: string;
  status?: string;
  role?: string;
  page?: number;
  size?: number;
}

export const adminApi = {
  getStats: async (): Promise<AdminDashboardStats> => {
    const res = await api.get<ApiResponse<AdminDashboardStats>>('/admin/stats');
    return res.data.data;
  },

  getUsers: async (params: AdminUsersQuery = {}) => {
    const res = await api.get<ApiResponse<{ data: AdminUser[]; pagination: any }>>('/admin/users', {
      params: {
        query: params.query || undefined,
        status: params.status || undefined,
        role: params.role || undefined,
        page: params.page ?? 0,
        size: params.size ?? 20,
      },
    });
    return res.data.data;
  },

  updateUserStatus: async (userId: string, status: string, reason?: string): Promise<AdminUser> => {
    const res = await api.put<ApiResponse<AdminUser>>(`/admin/users/${userId}/status`, {
      status,
      reason,
    });
    return res.data.data;
  },

  updateUserRole: async (userId: string, role: string, reason?: string): Promise<AdminUser> => {
    const res = await api.put<ApiResponse<AdminUser>>(`/admin/users/${userId}/role`, {
      role,
      reason,
    });
    return res.data.data;
  },

  getReports: async (status?: ReportStatus, page = 0, size = 20) => {
    const res = await api.get<ApiResponse<{ data: ReportDto[]; pagination: any }>>('/admin/reports', {
      params: {
        status: status || undefined,
        page,
        size,
      },
    });
    return res.data.data;
  },

  resolveReport: async (reportId: string, status: 'RESOLVED' | 'DISMISSED', resolutionNotes?: string): Promise<ReportDto> => {
    const res = await api.put<ApiResponse<ReportDto>>(`/admin/reports/${reportId}/resolve`, {
      status,
      resolutionNotes,
    });
    return res.data.data;
  },

  getAuditLogs: async (page = 0, size = 20) => {
    const res = await api.get<ApiResponse<{ data: AuditLog[]; pagination: any }>>('/admin/audit-logs', {
      params: { page, size },
    });
    return res.data.data;
  },
};

export default adminApi;
