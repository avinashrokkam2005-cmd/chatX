import api from '../../../services/api';
import { ApiResponse } from '../../../types/auth';
import {
  ConversationDto,
  CreateGroupConversationRequest,
  UpdateGroupRequest,
} from '../../../types/conversation';

export const conversationApi = {
  getOrCreateDirectConversation: async (recipientId: string): Promise<ConversationDto> => {
    const response = await api.post<ApiResponse<ConversationDto>>('/conversations/direct', {
      recipientId,
    });
    return response.data.data;
  },

  createGroupConversation: async (request: CreateGroupConversationRequest): Promise<ConversationDto> => {
    const response = await api.post<ApiResponse<ConversationDto>>('/conversations/group', request);
    return response.data.data;
  },

  getUserConversations: async (): Promise<ConversationDto[]> => {
    const response = await api.get<ApiResponse<ConversationDto[]>>('/conversations');
    return response.data.data;
  },

  getConversationById: async (conversationId: string): Promise<ConversationDto> => {
    const response = await api.get<ApiResponse<ConversationDto>>(`/conversations/${conversationId}`);
    return response.data.data;
  },

  addMembers: async (conversationId: string, memberIds: string[]): Promise<ConversationDto> => {
    const response = await api.post<ApiResponse<ConversationDto>>(`/conversations/${conversationId}/members`, {
      memberIds,
    });
    return response.data.data;
  },

  removeMember: async (conversationId: string, memberId: string): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/conversations/${conversationId}/members/${memberId}`);
  },

  updateGroup: async (conversationId: string, request: UpdateGroupRequest): Promise<ConversationDto> => {
    const response = await api.put<ApiResponse<ConversationDto>>(`/conversations/${conversationId}`, request);
    return response.data.data;
  },
};

export default conversationApi;
