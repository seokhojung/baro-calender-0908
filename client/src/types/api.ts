/**
 * API Types aligned with Backend Schema
 * Based on src/api/v1/events.js backend implementation
 */

// Core API Types
export interface APIResponse<T> {
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

// Event API Types (Backend Schema Aligned)
export interface APIEvent {
  id: number;
  title: string;
  description?: string;
  location?: string;
  starts_at_utc: string; // ISO datetime string
  ends_at_utc: string; // ISO datetime string
  timezone: string;
  is_all_day: boolean;
  color: string; // Hex color code #RRGGBB
  status: 'confirmed' | 'tentative' | 'cancelled';
  visibility: 'default' | 'public' | 'private' | 'confidential';
  rrule_json?: string; // RRULE string for recurring events
  exdates_json?: string; // Exception dates for recurring events
  project_id: number;
  tenant_id: number;
  created_by: number;
  updated_by: number;
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
  tags?: APIEventTag[];
  attachments?: APIEventAttachment[];
  reminders?: APIEventReminder[];
}

export interface APIEventTag {
  id?: number;
  tag_name: string;
  tag_color: string; // Hex color code #RRGGBB
}

export interface APIEventAttachment {
  id: number;
  file_name: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
}

export interface APIEventReminder {
  id: number;
  minutes_before: number; // 0 to 40320 (4 weeks)
  method: 'email' | 'popup' | 'push';
}

export interface APIEventOccurrence {
  id: number;
  event_id: number;
  occurrence_start_utc: string;
  occurrence_end_utc: string;
  is_exception: boolean;
  exception_data?: object;
}

// Request Types
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
  tags?: Omit<APIEventTag, 'id'>[];
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
  tags?: Omit<APIEventTag, 'id'>[];
}

export interface GetEventsParams {
  tenant_id: number;
  project_id: number;
  from?: string; // ISO datetime string
  to?: string; // ISO datetime string
  status?: 'confirmed' | 'tentative' | 'cancelled';
  tags?: string[];
  limit?: number; // 1-100, default 20
  offset?: number; // default 0
}

export interface GetOccurrencesParams {
  tenant_id: number;
  project_id?: number;
  from: string; // ISO datetime string
  to: string; // ISO datetime string
  event_id?: number;
}

export interface CreateReminderRequest {
  minutes_before: number; // 0 to 40320
  method: 'email' | 'popup' | 'push';
}

// Response Types
export interface GetEventsResponse {
  events: APIEvent[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateEventResponse {
  id: number;
  message: string;
}

export interface UpdateEventResponse {
  message: string;
}

export interface DeleteEventResponse {
  message: string;
}

export interface GetOccurrencesResponse {
  occurrences: APIEventOccurrence[];
}

export interface CreateReminderResponse {
  id: number;
  message: string;
}

// Project API Types (for context)
export interface APIProject {
  id: number;
  tenant_id: number;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  settings: {
    defaultDuration: number;
    defaultReminders: number[];
    allowOverlap: boolean;
  };
}

// Timeline API Types
export interface TimelineParams {
  tenant_id: number;
  project_ids?: number[];
  from: string;
  to: string;
  granularity?: 'day' | 'week' | 'month';
}

export interface TimelineEntry {
  date: string;
  events: APIEvent[];
  event_count: number;
  has_conflicts: boolean;
}

export interface TimelineResponse {
  timeline: TimelineEntry[];
  summary: {
    total_events: number;
    total_conflicts: number;
    busiest_day: string;
    lightest_day: string;
  };
}

// Error Types
export interface APIError {
  error: string;
  code?: number;
  details?: any;
}

// Validation Types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationErrorResponse {
  error: string;
  validation_errors: ValidationError[];
}

// Client-side transformation types (for internal use)
export interface CalendarEventTransformed {
  // Transformed from APIEvent for client use
  id: string; // Convert number to string
  title: string;
  description?: string;
  startDate: Date; // Convert from ISO string
  endDate: Date; // Convert from ISO string
  allDay: boolean; // Rename from is_all_day
  color: string;
  category?: string; // Derived from project or tags
  location?: string;
  recurring?: {
    type: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: Date;
  };
  attendees?: string[];
  reminders?: {
    type: 'email' | 'popup' | 'push';
    minutes: number;
  }[];
  // Backend fields
  projectId: number;
  tenantId: number;
  status: 'confirmed' | 'tentative' | 'cancelled';
  visibility: 'default' | 'public' | 'private' | 'confidential';
  tags?: APIEventTag[];
  createdAt: Date;
  updatedAt: Date;
}

// Utility types for API operations
export type EventsFilterOptions = Pick<GetEventsParams, 'status' | 'tags' | 'from' | 'to'>;
export type EventsSortOptions = 'starts_at_utc' | 'title' | 'created_at' | 'updated_at';
export type EventsOrderOptions = 'asc' | 'desc';

export interface EventsQuery extends EventsFilterOptions {
  sort?: EventsSortOptions;
  order?: EventsOrderOptions;
  search?: string;
}

// API Client Configuration
export interface APIClientConfig {
  baseURL: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
  auth?: {
    token: string;
    type: 'Bearer' | 'Basic';
  };
}

// HTTP Client Types
export interface HTTPResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export interface HTTPError extends Error {
  status?: number;
  response?: HTTPResponse;
  isAPIError: boolean;
}

// Cache Types for React Query
export interface CacheOptions {
  staleTime?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
}

export type QueryKey = readonly unknown[];

// Optimistic Update Types
export interface OptimisticEventUpdate {
  type: 'create' | 'update' | 'delete';
  eventId: string;
  eventData?: Partial<CalendarEventTransformed>;
  previousData?: CalendarEventTransformed;
}

export default {};