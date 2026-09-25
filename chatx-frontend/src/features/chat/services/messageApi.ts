import api from '../../../services/api';
import { ApiResponse } from '../../../types/auth';
import {
  MessageDto,
  SendMessageRequest,
  EditMessageRequest,
  MessageReactionDto,
} from '../../../types/message';

export const messageApi = {
  sendMessage: async (request: SendMessageRequest): Promise<MessageDto> => {
    const res = await api.post<ApiResponse<MessageDto>>('/messages', request);
    return res.data.data;
  },

  getConversationMessages: async (
    conversationId: string,
    cursor?: string,
    limit: number = 50
  ): Promise<MessageDto[]> => {
    const params: Record<string, any> = { limit };
    if (cursor) params.cursor = cursor;
    const res = await api.get<ApiResponse<MessageDto[]>>(`/messages/conversations/${conversationId}`, { params });
    return res.data.data;
  },

  editMessage: async (messageId: string, request: EditMessageRequest): Promise<MessageDto> => {
    const res = await api.put<ApiResponse<MessageDto>>(`/messages/${messageId}`, request);
    return res.data.data;
  },

  deleteMessage: async (messageId: string): Promise<MessageDto> => {
    const res = await api.delete<ApiResponse<MessageDto>>(`/messages/${messageId}`);
    return res.data.data;
  },

  toggleReaction: async (messageId: string, emoji: string): Promise<MessageReactionDto[]> => {
    const res = await api.post<ApiResponse<MessageReactionDto[]>>(`/messages/${messageId}/reactions`, { emoji });
    return res.data.data;
  },

  markConversationAsRead: async (conversationId: string): Promise<void> => {
    await api.post(`/messages/conversations/${conversationId}/read`);
  },
};

export default messageApi;
