import api from '../../../services/api';
import { ApiResponse } from '../../../types/auth';
import { ProfileDto, UpdateProfileRequest } from '../../../types/profile';

export const profileApi = {
  getMyProfile: async (): Promise<ProfileDto> => {
    const response = await api.get<ApiResponse<ProfileDto>>('/profiles/me');
    return response.data.data;
  },

  updateMyProfile: async (request: UpdateProfileRequest): Promise<ProfileDto> => {
    const response = await api.put<ApiResponse<ProfileDto>>('/profiles/me', request);
    return response.data.data;
  },

  getProfileById: async (userId: string): Promise<ProfileDto> => {
    const response = await api.get<ApiResponse<ProfileDto>>(`/profiles/${userId}`);
    return response.data.data;
  },

  getProfileByUsername: async (username: string): Promise<ProfileDto> => {
    const cleanUsername = username.startsWith('@') ? username.substring(1) : username;
    const response = await api.get<ApiResponse<ProfileDto>>(`/profiles/by-username/${cleanUsername}`);
    return response.data.data;
  },
};

export default profileApi;
