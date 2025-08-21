export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface TimelineResponse {
  events: EventOccurrence[];
  projects: Project[];
}

export interface ProjectsResponse {
  projects: Project[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface ApiError {
  code: number;
  message: string;
  details?: any;
}

// Re-export calendar types
export type { Event, EventOccurrence, Project, Member } from './calendar';
