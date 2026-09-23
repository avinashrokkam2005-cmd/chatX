import { UserRole, MessagePrivacy } from './auth';

export interface ProfileDto {
  userId: string;
  username: string;
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  messagePrivacy: MessagePrivacy;
  lastSeenAt?: string | null;
  createdAt: string;
}

export interface UpdateProfileRequest {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface UserSearchDto {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  messagePrivacy: MessagePrivacy;
}
