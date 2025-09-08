// Store Types for State Management
export interface BaseStore {
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// Calendar Store Types
export type ViewMode = 'month' | 'week' | 'day' | 'year';

export interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  color: string;
  category?: string;
  projectId?: string;
  recurring?: {
    type: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: Date;
  };
  attendees?: string[];
  location?: string;
  reminders?: {
    type: 'email' | 'popup';
    minutes: number;
  }[];
}

export interface CalendarState extends BaseStore {
  currentDate: Date;
  viewMode: ViewMode;
  selectedDate: Date | null;
  events: Event[];
  selectedEventId: string | null;
  filters: {
    categories: string[];
    dateRange: {
      start: Date | null;
      end: Date | null;
    };
  };
}

export interface CalendarActions {
  setCurrentDate: (date: Date) => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedDate: (date: Date | null) => void;
  addEvent: (event: Omit<Event, 'id'>) => Promise<void>;
  updateEvent: (id: string, event: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  setSelectedEventId: (id: string | null) => void;
  setFilters: (filters: Partial<CalendarState['filters']>) => void;
  loadEvents: (dateRange: { start: Date; end: Date }) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// Project Store Types
export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  settings: {
    defaultDuration: number; // in minutes
    defaultReminders: number[]; // minutes before
    allowOverlap: boolean;
  };
}

export interface ProjectState extends BaseStore {
  projects: Project[];
  activeProjectId: string | null;
  selectedProjectIds: string[];
}

export interface ProjectActions {
  loadProjects: () => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProject: (id: string, project: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setActiveProject: (id: string | null) => void;
  setSelectedProjects: (ids: string[]) => void;
  toggleProjectSelection: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// User Store Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  timezone: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    dateFormat: string;
    timeFormat: '12h' | '24h';
    weekStartsOn: 0 | 1; // 0 = Sunday, 1 = Monday
    defaultView: ViewMode;
    notifications: {
      email: boolean;
      browser: boolean;
      mobile: boolean;
    };
  };
  subscription?: {
    plan: 'free' | 'pro' | 'enterprise';
    status: 'active' | 'cancelled' | 'expired';
    expiresAt?: Date;
  };
}

export interface UserState extends BaseStore {
  user: User | null;
  isAuthenticated: boolean;
  permissions: string[];
}

export interface UserActions {
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateUser: (user: Partial<User>) => Promise<void>;
  updatePreferences: (preferences: Partial<User['preferences']>) => Promise<void>;
  setUser: (user: User | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setPermissions: (permissions: string[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// UI Store Types
export interface UIState extends BaseStore {
  sidebarOpen: boolean;
  modalStack: string[];
  activeModal: string | null;
  notifications: {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
    createdAt: Date;
  }[];
  breadcrumb: {
    label: string;
    href?: string;
  }[];
  theme: 'light' | 'dark' | 'system';
  compactMode: boolean;
}

export interface UIActions {
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  openModal: (modalId: string) => void;
  closeModal: (modalId?: string) => void;
  closeAllModals: () => void;
  addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'createdAt'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setBreadcrumb: (breadcrumb: UIState['breadcrumb']) => void;
  setTheme: (theme: UIState['theme']) => void;
  setCompactMode: (compact: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// Combined Store Types
export type CalendarStore = CalendarState & CalendarActions;
export type ProjectStore = ProjectState & ProjectActions;
export type UserStore = UserState & UserActions;
export type UIStore = UIState & UIActions;

// Store Selectors
export interface StoreSelectors {
  // Calendar selectors
  getEventsForDate: (date: Date) => Event[];
  getEventsForDateRange: (start: Date, end: Date) => Event[];
  getSelectedEvent: () => Event | null;
  getFilteredEvents: () => Event[];
  
  // Project selectors
  getActiveProject: () => Project | null;
  getSelectedProjects: () => Project[];
  getActiveProjectEvents: () => Event[];
  
  // User selectors
  getUserPreferences: () => User['preferences'] | null;
  hasPermission: (permission: string) => boolean;
  
  // UI selectors
  isModalOpen: (modalId: string) => boolean;
  getActiveNotifications: () => UIState['notifications'];
}

// Persistence Configuration
export interface PersistConfig {
  name: string;
  storage?: any;
  partialize?: (state: any) => any;
  version?: number;
  migrate?: (persistedState: any, version: number) => any;
}