// API 응답 타입
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

// 사용자 관련 타입
export interface User {
  id: number;
  email: string;
  name: string;
  phone_number?: string;
  two_factor_enabled: boolean;
  oauth_only: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  totp_code?: string;
  remember_me?: boolean;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
  requires_2fa?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone_number?: string;
}

// OAuth 관련 타입
export interface OAuthConnection {
  provider: 'google' | 'github' | 'microsoft' | 'facebook';
  provider_email: string;
  provider_name: string;
  created_at: string;
}

export interface OAuthConnectionsResponse {
  connections: OAuthConnection[];
}

// 2FA 관련 타입
export interface Setup2FARequest {
  method: 'totp' | 'sms';
  phone_number?: string;
}

export interface Setup2FAResponse {
  secret?: string;
  qr_code?: string;
  backup_codes?: string[];
  message: string;
  phone_number?: string;
}

export interface Verify2FARequest {
  method: 'totp' | 'sms';
  code: string;
}

// 이벤트 관련 타입 확장
export interface EventTag {
  id?: number;
  tag_name: string;
  tag_color?: string;
}

export interface EventAttachment {
  id: number;
  file_name: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
}

export interface EventReminder {
  id: number;
  minutes_before: number;
  method: 'email' | 'popup' | 'push';
}

export interface CreateEventRequest {
  tenant_id: number;
  project_id: number;
  title: string;
  description?: string;
  location?: string;
  starts_at_utc: string;
  ends_at_utc: string;
  timezone?: string;
  is_all_day?: boolean;
  color?: string;
  status?: 'confirmed' | 'tentative' | 'cancelled';
  visibility?: 'default' | 'public' | 'private' | 'confidential';
  rrule_json?: string;
  exdates_json?: string;
  tags?: EventTag[];
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  location?: string;
  starts_at_utc?: string;
  ends_at_utc?: string;
  timezone?: string;
  is_all_day?: boolean;
  color?: string;
  status?: 'confirmed' | 'tentative' | 'cancelled';
  visibility?: 'default' | 'public' | 'private' | 'confidential';
  rrule_json?: string;
  exdates_json?: string;
  tags?: EventTag[];
}

export interface EventListRequest {
  tenant_id: number;
  project_id: number;
  from?: string;
  to?: string;
  status?: 'confirmed' | 'tentative' | 'cancelled';
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface EventListResponse {
  events: Event[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateProjectRequest {
  tenant_id: number;
  name: string;
  color?: string;
  description?: string;
  settings?: Record<string, any>;
}

// 에러 타입
export interface ApiError {
  error: string;
  message?: string;
  code?: string;
  details?: any;
}

// 인증 관련 타입
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

// Re-export calendar types
export type { Event, EventOccurrence, Project, Member } from './calendar';
