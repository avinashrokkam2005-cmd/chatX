import api from '../../../services/api';
import { ApiResponse } from '../../../types/auth';
import { NotificationDto } from '../../../types/notification';

export interface PagedNotifications {
  data: NotificationDto[];
  pagination: {
    hasMore: boolean;
    size: number;
    totalElements: number;
  };
}

export const notificationApi = {
  getNotifications: async (page: number = 0, size: number = 20): Promise<PagedNotifications> => {
    const res = await api.get<ApiResponse<PagedNotifications>>('/notifications', {
      params: { page, size },
    });
    return res.data.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await api.get<ApiResponse<number>>('/notifications/unread-count');
    return res.data.data;
  },

  markAsRead: async (id: string): Promise<NotificationDto> => {
    const res = await api.put<ApiResponse<NotificationDto>>(`/notifications/${id}/read`);
    return res.data.data;
  },

  markAllAsRead: async (): Promise<void> => {
    await api.put('/notifications/read-all');
  },
};

export default notificationApi;
