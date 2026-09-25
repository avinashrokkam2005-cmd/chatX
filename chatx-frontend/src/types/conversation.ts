import { UserSummary } from './auth';

export type ConversationType = 'DIRECT' | 'GROUP';
export type ConversationMemberRole = 'ADMIN' | 'MEMBER';

export interface ConversationMemberDto {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  role: ConversationMemberRole;
  joinedAt: string;
}

export interface ConversationDto {
  id: string;
  type: ConversationType;
  name: string;
  description?: string | null;
  avatarUrl?: string | null;
  directParticipant?: UserSummary | null;
  members?: ConversationMemberDto[];
  memberCount: number;
  lastMessageId?: string | null;
  lastMessageContent?: string | null;
  lastMessageAt?: string | null;
  lastMessageSenderUsername?: string | null;
  unreadCount: number;
  myRole?: ConversationMemberRole;
  createdAt: string;
}

export interface CreateDirectConversationRequest {
  recipientId: string;
}

export interface CreateGroupConversationRequest {
  name: string;
  description?: string;
  avatarUrl?: string;
  memberIds?: string[];
}

export interface AddMembersRequest {
  memberIds: string[];
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  avatarUrl?: string;
}
