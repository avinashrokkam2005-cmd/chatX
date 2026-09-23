import api from '../../../services/api';
import { ApiResponse } from '../../../types/auth';
import { FriendDto, FriendRequestDto } from '../../../types/friend';

export const friendApi = {
  sendFriendRequest: async (targetUserId: string): Promise<FriendRequestDto> => {
    const response = await api.post<ApiResponse<FriendRequestDto>>('/friends/requests', {
      targetUserId,
    });
    return response.data.data;
  },

  getReceivedRequests: async (): Promise<FriendRequestDto[]> => {
    const response = await api.get<ApiResponse<FriendRequestDto[]>>('/friends/requests/received');
    return response.data.data;
  },

  getSentRequests: async (): Promise<FriendRequestDto[]> => {
    const response = await api.get<ApiResponse<FriendRequestDto[]>>('/friends/requests/sent');
    return response.data.data;
  },

  acceptFriendRequest: async (requestId: string): Promise<FriendDto> => {
    const response = await api.put<ApiResponse<FriendDto>>(`/friends/requests/${requestId}/accept`);
    return response.data.data;
  },

  rejectFriendRequest: async (requestId: string): Promise<void> => {
    await api.put<ApiResponse<void>>(`/friends/requests/${requestId}/reject`);
  },

  cancelFriendRequest: async (requestId: string): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/friends/requests/${requestId}`);
  },

  getFriends: async (): Promise<FriendDto[]> => {
    const response = await api.get<ApiResponse<FriendDto[]>>('/friends');
    return response.data.data;
  },

  removeFriend: async (friendId: string): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/friends/${friendId}`);
  },
};

export default friendApi;
