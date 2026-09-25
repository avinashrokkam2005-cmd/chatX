import api from '../../../services/api';
import { ApiResponse } from '../../../types/auth';

export const presenceApi = {
  isUserOnline: async (userId: string): Promise<boolean> => {
    const res = await api.get<ApiResponse<boolean>>(`/presence/users/${userId}`);
    return res.data.data;
  },

  getOnlineStatusBatch: async (userIds: string[]): Promise<Record<string, boolean>> => {
    const res = await api.post<ApiResponse<Record<string, boolean>>>('/presence/batch', userIds);
    return res.data.data;
  },
};

export default presenceApi;
