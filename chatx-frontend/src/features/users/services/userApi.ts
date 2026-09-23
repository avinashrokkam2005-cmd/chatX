import api from '../../../services/api';
import { ApiResponse, UserSummary, MessagePrivacy } from '../../../types/auth';
import { UserSearchDto } from '../../../types/profile';

export const userApi = {
  searchUsers: async (query: string, page = 0, size = 20): Promise<UserSearchDto[]> => {
    const response = await api.get<ApiResponse<UserSearchDto[]>>('/users/search', {
      params: { q: query, page, size },
    });
    return response.data.data;
  },

  getUserById: async (userId: string): Promise<UserSummary> => {
    const response = await api.get<ApiResponse<UserSummary>>(`/users/${userId}`);
    return response.data.data;
  },

  updatePrivacy: async (messagePrivacy: MessagePrivacy): Promise<UserSummary> => {
    const response = await api.put<ApiResponse<UserSummary>>('/users/me/privacy', {
      messagePrivacy,
    });
    return response.data.data;
  },
};

export default userApi;
