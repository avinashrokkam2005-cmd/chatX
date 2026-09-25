export type MessageType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE' | 'VOICE' | 'SYSTEM';
export type ReceiptStatus = 'SENT' | 'DELIVERED' | 'READ';

export interface MessageAttachmentDto {
  id?: string;
  fileName: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
}

export interface MessageReactionDto {
  emoji: string;
  count: number;
  hasReacted: boolean;
  usernames: string[];
}

export interface MessageReplySummaryDto {
  id: string;
  senderUsername: string;
  senderDisplayName?: string;
  type: MessageType;
  content: string;
}

export interface MessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  senderUsername: string;
  senderDisplayName?: string;
  senderAvatarUrl?: string;
  type: MessageType;
  content: string;
  isEdited: boolean;
  isDeleted: boolean;
  replyTo?: MessageReplySummaryDto;
  reactions: MessageReactionDto[];
  attachments: MessageAttachmentDto[];
  deliveryStatus: ReceiptStatus;
  readCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageRequest {
  conversationId: string;
  content?: string;
  type?: MessageType;
  replyToMessageId?: string;
  attachments?: MessageAttachmentDto[];
}

export interface EditMessageRequest {
  content: string;
}
