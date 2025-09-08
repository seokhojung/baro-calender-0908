/**
 * Calendar API Client
 * Type-safe API client for calendar operations
 */

import {
  APIEvent,
  APIEventOccurrence,
  CreateEventRequest,
  UpdateEventRequest,
  GetEventsParams,
  GetOccurrencesParams,
  CreateReminderRequest,
  GetEventsResponse,
  CreateEventResponse,
  UpdateEventResponse,
  DeleteEventResponse,
  GetOccurrencesResponse,
  CreateReminderResponse,
  CalendarEventTransformed,
  HTTPError,
  HTTPResponse
} from '@/types/api';

/**
 * Base HTTP Client with error handling
 */
class HTTPClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string) {
    this.baseURL = baseURL.replace(/\/$/, ''); // Remove trailing slash
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    method: string,
    endpoint: string,
    options: {
      body?: any;
      headers?: Record<string, string>;
      query?: Record<string, any>;
    } = {}
  ): Promise<HTTPResponse<T>> {
    const url = new URL(`${this.baseURL}${endpoint}`);
    
    // Add query parameters
    if (options.query) {
      Object.entries(options.query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => url.searchParams.append(key, String(v)));
          } else {
            url.searchParams.set(key, String(value));
          }
        }
      });
    }

    const headers = { ...this.defaultHeaders, ...options.headers };
    
    const config: RequestInit = {
      method,
      headers,
    };

    if (options.body && method !== 'GET') {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url.toString(), config);
      
      let data: T;
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text() as unknown as T;
      }

      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as HTTPError;
        error.status = response.status;
        error.response = {
          data,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
        };
        error.isAPIError = true;
        throw error;
      }

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      };
    } catch (error) {
      if (error instanceof Error && 'isAPIError' in error) {
        throw error;
      }
      
      // Network or other errors
      const networkError = new Error(`Network error: ${error.message}`) as HTTPError;
      networkError.isAPIError = false;
      throw networkError;
    }
  }

  async get<T>(endpoint: string, query?: Record<string, any>): Promise<HTTPResponse<T>> {
    return this.request<T>('GET', endpoint, { query });
  }

  async post<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<HTTPResponse<T>> {
    return this.request<T>('POST', endpoint, { body, headers });
  }

  async patch<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<HTTPResponse<T>> {
    return this.request<T>('PATCH', endpoint, { body, headers });
  }

  async delete<T>(endpoint: string): Promise<HTTPResponse<T>> {
    return this.request<T>('DELETE', endpoint);
  }

  setAuthToken(token: string) {
    this.defaultHeaders.Authorization = `Bearer ${token}`;
  }

  clearAuthToken() {
    delete this.defaultHeaders.Authorization;
  }
}

/**
 * Calendar API Client
 */
export class CalendarAPIClient {
  private http: HTTPClient;

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') {
    this.http = new HTTPClient(baseURL);
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string) {
    this.http.setAuthToken(token);
  }

  /**
   * Clear authentication token
   */
  clearAuthToken() {
    this.http.clearAuthToken();
  }

  /**
   * Get events list
   */
  async getEvents(params: GetEventsParams): Promise<GetEventsResponse> {
    const response = await this.http.get<GetEventsResponse>('/v1/events', params);
    return response.data;
  }

  /**
   * Get single event by ID
   */
  async getEvent(id: number): Promise<APIEvent> {
    const response = await this.http.get<APIEvent>(`/v1/events/${id}`);
    return response.data;
  }

  /**
   * Create new event
   */
  async createEvent(eventData: CreateEventRequest): Promise<CreateEventResponse> {
    const response = await this.http.post<CreateEventResponse>('/v1/events', eventData);
    return response.data;
  }

  /**
   * Update existing event
   */
  async updateEvent(id: number, eventData: UpdateEventRequest): Promise<UpdateEventResponse> {
    const response = await this.http.patch<UpdateEventResponse>(`/v1/events/${id}`, eventData);
    return response.data;
  }

  /**
   * Delete event
   */
  async deleteEvent(id: number): Promise<DeleteEventResponse> {
    const response = await this.http.delete<DeleteEventResponse>(`/v1/events/${id}`);
    return response.data;
  }

  /**
   * Get event occurrences (for recurring events)
   */
  async getOccurrences(params: GetOccurrencesParams): Promise<GetOccurrencesResponse> {
    const response = await this.http.get<GetOccurrencesResponse>('/v1/events/occurrences', params);
    return response.data;
  }

  /**
   * Create event reminder
   */
  async createReminder(eventId: number, reminderData: CreateReminderRequest): Promise<CreateReminderResponse> {
    const response = await this.http.post<CreateReminderResponse>(
      `/v1/events/${eventId}/reminders`,
      reminderData
    );
    return response.data;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await this.http.get<{ status: string; timestamp: string }>('/health');
      return response.data;
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString()
      };
    }
  }
}

/**
 * Data transformation utilities
 */
export class CalendarDataTransformer {
  /**
   * Transform API event to client event format
   */
  static apiEventToClient(apiEvent: APIEvent): CalendarEventTransformed {
    return {
      id: String(apiEvent.id),
      title: apiEvent.title,
      description: apiEvent.description,
      startDate: new Date(apiEvent.starts_at_utc),
      endDate: new Date(apiEvent.ends_at_utc),
      allDay: apiEvent.is_all_day,
      color: apiEvent.color,
      location: apiEvent.location,
      projectId: apiEvent.project_id,
      tenantId: apiEvent.tenant_id,
      status: apiEvent.status,
      visibility: apiEvent.visibility,
      tags: apiEvent.tags,
      createdAt: new Date(apiEvent.created_at),
      updatedAt: new Date(apiEvent.updated_at),
      // Transform reminders
      reminders: apiEvent.reminders?.map(r => ({
        type: r.method,
        minutes: r.minutes_before
      })),
      // Transform recurring rules (simplified)
      recurring: apiEvent.rrule_json ? this.parseRRule(apiEvent.rrule_json) : undefined,
    };
  }

  /**
   * Transform client event to API format
   */
  static clientEventToAPI(
    clientEvent: Partial<CalendarEventTransformed>,
    tenantId: number,
    projectId: number
  ): CreateEventRequest | UpdateEventRequest {
    const base = {
      title: clientEvent.title!,
      description: clientEvent.description,
      location: clientEvent.location,
      starts_at_utc: clientEvent.startDate!.toISOString(),
      ends_at_utc: clientEvent.endDate!.toISOString(),
      is_all_day: clientEvent.allDay || false,
      color: clientEvent.color,
      status: clientEvent.status || 'confirmed',
      visibility: clientEvent.visibility || 'default',
      // Convert tags if provided
      tags: clientEvent.tags?.map(tag => ({
        tag_name: tag.tag_name,
        tag_color: tag.tag_color
      })),
      // Convert recurring rules
      rrule_json: clientEvent.recurring ? this.buildRRule(clientEvent.recurring) : undefined,
    };

    // Add tenant_id and project_id for create requests
    if ('tenantId' in clientEvent || 'projectId' in clientEvent) {
      return {
        ...base,
        tenant_id: tenantId,
        project_id: projectId,
      } as CreateEventRequest;
    }

    return base as UpdateEventRequest;
  }

  /**
   * Parse RRULE string to client format (simplified)
   */
  private static parseRRule(rruleString: string): CalendarEventTransformed['recurring'] {
    // Simplified RRULE parsing - in production, use rrule.js library
    if (rruleString.includes('FREQ=DAILY')) {
      return { type: 'daily', interval: 1 };
    }
    if (rruleString.includes('FREQ=WEEKLY')) {
      return { type: 'weekly', interval: 1 };
    }
    if (rruleString.includes('FREQ=MONTHLY')) {
      return { type: 'monthly', interval: 1 };
    }
    if (rruleString.includes('FREQ=YEARLY')) {
      return { type: 'yearly', interval: 1 };
    }
    return undefined;
  }

  /**
   * Build RRULE string from client format (simplified)
   */
  private static buildRRule(recurring: CalendarEventTransformed['recurring']): string {
    if (!recurring) return '';
    
    const freq = recurring.type.toUpperCase();
    const interval = recurring.interval > 1 ? `;INTERVAL=${recurring.interval}` : '';
    const until = recurring.endDate ? `;UNTIL=${recurring.endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z` : '';
    
    return `FREQ=${freq}${interval}${until}`;
  }

  /**
   * Transform events list from API to client format
   */
  static transformEventsList(apiEvents: APIEvent[]): CalendarEventTransformed[] {
    return apiEvents.map(event => this.apiEventToClient(event));
  }

  /**
   * Transform date range to API format
   */
  static dateRangeToAPI(start: Date, end: Date): { from: string; to: string } {
    return {
      from: start.toISOString(),
      to: end.toISOString()
    };
  }
}

/**
 * Default calendar API client instance
 */
export const calendarAPI = new CalendarAPIClient();

/**
 * Hook to get calendar API client with auth token
 */
export const useCalendarAPI = () => {
  // This would typically get the auth token from your auth store
  // For now, returning the default client
  return calendarAPI;
};

export default CalendarAPIClient;