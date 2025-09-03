import type {
  ApiResponse,
  PaginatedResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
  Setup2FARequest,
  Setup2FAResponse,
  Verify2FARequest,
  RefreshTokenRequest,
  AuthTokens,
  OAuthConnectionsResponse,
  CreateEventRequest,
  UpdateEventRequest,
  EventListRequest,
  EventListResponse,
  CreateProjectRequest,
  Event,
  Project,
  Member,
  ApiError
} from '../types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ApiConfig {
  timeout?: number;
  retries?: number;
  onUnauthorized?: () => void;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null;
  private refreshToken: string | null;
  private config: ApiConfig;

  constructor(config: ApiConfig = {}) {
    this.baseUrl = API_BASE_URL;
    this.token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    this.refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
    this.config = {
      timeout: 30000,
      retries: 3,
      ...config
    };
  }

  setTokens(tokens: AuthTokens) {
    this.token = tokens.access_token;
    this.refreshToken = tokens.refresh_token;
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', tokens.access_token);
      localStorage.setItem('refresh_token', tokens.refresh_token);
    }
  }

  clearTokens() {
    this.token = null;
    this.refreshToken = null;
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const tokens = await this.request<AuthTokens>('/v1/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: this.refreshToken }),
        skipAuth: true
      });
      
      this.setTokens(tokens);
      return true;
    } catch (error) {
      this.clearTokens();
      this.config.onUnauthorized?.();
      return false;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit & { skipAuth?: boolean; skipRetry?: boolean } = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const { skipAuth = false, skipRetry = false, ...requestOptions } = options;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...requestOptions.headers,
    };

    if (!skipAuth && this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...requestOptions,
      headers,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.status === 401 && !skipAuth && !skipRetry) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          return this.request<T>(endpoint, { ...options, skipRetry: true });
        }
      }
      
      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({
          error: `HTTP ${response.status}`,
          message: response.statusText
        }));
        throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      console.error('API request failed:', error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Authentication methods
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      skipAuth: true
    });
    
    if (!response.requires_2fa) {
      this.setTokens({
        access_token: response.access_token,
        refresh_token: response.refresh_token
      });
    }
    
    return response;
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<User>> {
    return this.request<ApiResponse<User>>('/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      skipAuth: true
    });
  }

  async logout(): Promise<ApiResponse> {
    try {
      await this.request<ApiResponse>('/v1/auth/logout', { method: 'POST' });
    } finally {
      this.clearTokens();
    }
    return { message: 'Logged out successfully' };
  }

  async refreshTokens(): Promise<AuthTokens> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const tokens = await this.request<AuthTokens>('/v1/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: this.refreshToken }),
      skipAuth: true
    });
    
    this.setTokens(tokens);
    return tokens;
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/v1/auth/me');
  }

  // 2FA methods
  async setup2FA(request: Setup2FARequest): Promise<Setup2FAResponse> {
    return this.request<Setup2FAResponse>('/v1/auth/2fa/setup', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  async verify2FA(request: Verify2FARequest): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/v1/auth/2fa/verify', {
      method: 'POST',
      body: JSON.stringify(request)
    });
    
    this.setTokens({
      access_token: response.access_token,
      refresh_token: response.refresh_token
    });
    
    return response;
  }

  async disable2FA(code: string): Promise<ApiResponse> {
    return this.request<ApiResponse>('/v1/auth/2fa/disable', {
      method: 'POST',
      body: JSON.stringify({ code })
    });
  }

  // OAuth methods
  getOAuthUrl(provider: 'google' | 'github'): string {
    return `${this.baseUrl}/v1/oauth/${provider}`;
  }

  async getOAuthConnections(): Promise<OAuthConnectionsResponse> {
    return this.request<OAuthConnectionsResponse>('/v1/oauth/connections');
  }

  async disconnectOAuth(provider: 'google' | 'github'): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/v1/oauth/disconnect/${provider}`, {
      method: 'DELETE'
    });
  }

  // Event methods
  async createEvent(event: CreateEventRequest): Promise<Event> {
    return this.request<Event>('/v1/events', {
      method: 'POST',
      body: JSON.stringify(event)
    });
  }

  async updateEvent(eventId: number, updates: UpdateEventRequest): Promise<Event> {
    return this.request<Event>(`/v1/events/${eventId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  async deleteEvent(eventId: number): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/v1/events/${eventId}`, {
      method: 'DELETE'
    });
  }

  async getEvent(eventId: number): Promise<Event> {
    return this.request<Event>(`/v1/events/${eventId}`);
  }

  async getEvents(params: EventListRequest): Promise<EventListResponse> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(item => searchParams.append(key, item.toString()));
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });

    return this.request<EventListResponse>(`/v1/events?${searchParams.toString()}`);
  }

  // Project methods
  async createProject(project: CreateProjectRequest): Promise<Project> {
    return this.request<Project>('/v1/projects', {
      method: 'POST',
      body: JSON.stringify(project)
    });
  }

  async getProject(projectId: number): Promise<Project> {
    return this.request<Project>(`/v1/projects/${projectId}`);
  }

  async getProjects(tenantId: number): Promise<Project[]> {
    return this.request<Project[]>(`/v1/projects?tenant_id=${tenantId}`);
  }

  async updateProject(projectId: number, updates: Partial<CreateProjectRequest>): Promise<Project> {
    return this.request<Project>(`/v1/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  async deleteProject(projectId: number): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/v1/projects/${projectId}`, {
      method: 'DELETE'
    });
  }

  // Member methods
  async getProjectMembers(projectId: number): Promise<Member[]> {
    return this.request<Member[]>(`/v1/projects/${projectId}/members`);
  }

  async addProjectMember(projectId: number, memberData: { email: string; role: string }): Promise<Member> {
    return this.request<Member>(`/v1/projects/${projectId}/members`, {
      method: 'POST',
      body: JSON.stringify(memberData)
    });
  }

  async updateProjectMember(projectId: number, memberId: number, updates: { role: string }): Promise<Member> {
    return this.request<Member>(`/v1/projects/${projectId}/members/${memberId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  async removeProjectMember(projectId: number, memberId: number): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/v1/projects/${projectId}/members/${memberId}`, {
      method: 'DELETE'
    });
  }
}

export const apiClient = new ApiClient({
  onUnauthorized: () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
  }
});
