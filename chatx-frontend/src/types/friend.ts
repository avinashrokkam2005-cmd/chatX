import { UserSummary, MessagePrivacy } from './auth';

export type FriendRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';

export interface FriendDto {
  friendshipId: string;
  friendId: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  messagePrivacy: MessagePrivacy;
  friendsSince: string;
}

export interface FriendRequestDto {
  requestId: string;
  sender: UserSummary;
  receiver: UserSummary;
  status: FriendRequestStatus;
  createdAt: string;
}

export interface BlockDto {
  blockId: string;
  blockedUser: UserSummary;
  blockedAt: string;
}
