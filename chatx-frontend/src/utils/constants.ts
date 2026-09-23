export const APP_NAME = 'ChatX';

export const API_BASE_URL = '/api';

export const WS_URL = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  CHAT: '/chat',
  FRIENDS: '/friends',
  SEARCH: '/search',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  NOTIFICATIONS: '/notifications',
  ADMIN: '/admin',
} as const;

export const MESSAGE_TYPES = {
  TEXT: 'TEXT',
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
  FILE: 'FILE',
  VOICE: 'VOICE',
  SYSTEM: 'SYSTEM',
} as const;

export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
