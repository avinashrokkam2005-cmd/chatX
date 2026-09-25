export type NotificationType =
  | 'FRIEND_REQUEST'
  | 'FRIEND_ACCEPT'
  | 'NEW_MESSAGE'
  | 'GROUP_INVITE'
  | 'SYSTEM';

export interface NotificationDto {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  actorUsername?: string;
  actorDisplayName?: string;
  actorAvatarUrl?: string;
  referenceId?: string;
  referenceType?: string;
  read: boolean;
  createdAt: string;
}
