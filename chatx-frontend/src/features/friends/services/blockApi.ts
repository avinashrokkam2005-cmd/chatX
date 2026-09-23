import api from '../../../services/api';
import { ApiResponse } from '../../../types/auth';
import { BlockDto } from '../../../types/friend';

export const blockApi = {
  blockUser: async (userId: string): Promise<BlockDto> => {
    const response = await api.post<ApiResponse<BlockDto>>(`/blocks/${userId}`);
    return response.data.data;
  },

  unblockUser: async (userId: string): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/blocks/${userId}`);
  },

  getBlockedUsers: async (): Promise<BlockDto[]> => {
    const response = await api.get<ApiResponse<BlockDto[]>>('/blocks');
    return response.data.data;
  },
};

export default blockApi;
