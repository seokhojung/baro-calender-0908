// Schedule CRUD and Event Management Type Definitions

export interface Schedule {
  id: string
  title: string
  description?: string
  
  // Time management
  startDateTime: string
  endDateTime: string
  isAllDay: boolean
  timezone: string
  
  // Project integration
  projectId: string
  project: Project
  
  // Recurrence
  recurrenceRule?: RecurrenceRule
  parentId?: string // for recurring events
  
  // Attendees
  attendees: ScheduleAttendee[]
  
  // Status
  status: 'draft' | 'confirmed' | 'cancelled'
  isPrivate: boolean
  
  // Metadata
  location?: string
  url?: string
  attachments: string[]
  
  createdBy: string
  updatedBy: string
  createdAt: string
  updatedAt: string
  version: number // for optimistic updates
}

export interface ScheduleAttendee {
  userId: string
  email: string
  name: string
  role: 'organizer' | 'required' | 'optional'
  status: 'pending' | 'accepted' | 'declined' | 'tentative'
  responseAt?: string
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval: number // 1 = daily, 2 = every other day
  endDate?: string
  count?: number // number of occurrences
  byWeekDay?: number[] // days of week (0=Sunday)
  byMonthDay?: number[] // days of month (1-31)
}

export interface Project {
  id: string
  name: string
  color: string
  description?: string
}

// API Types
export interface CreateScheduleInput {
  title: string
  description?: string
  startDateTime: string
  endDateTime: string
  isAllDay: boolean
  timezone?: string
  projectId: string
  location?: string
  url?: string
  attendees: Omit<ScheduleAttendee, 'userId'>[]
  recurrenceRule?: RecurrenceRule
  isPrivate: boolean
}

export interface UpdateScheduleInput {
  title?: string
  description?: string
  startDateTime?: string
  endDateTime?: string
  isAllDay?: boolean
  location?: string
  url?: string
  attendees?: Omit<ScheduleAttendee, 'userId'>[]
  status?: Schedule['status']
  isPrivate?: boolean
}

export interface ScheduleFilters {
  projectIds?: string[]
  attendeeIds?: string[]
  status?: Schedule['status'][]
  isPrivate?: boolean
}

export interface DateRange {
  start: string
  end: string
}

// Conflict Detection
export interface ScheduleConflict {
  scheduleId: string
  title: string
  startDateTime: string
  endDateTime: string
  severity: 'high' | 'medium' | 'low'
  conflictingAttendees: string[]
}

export interface TimeSlotSuggestion {
  startDateTime: string
  endDateTime: string
  reason: string
}

export interface ConflictCheckResult {
  hasConflicts: boolean
  conflicts: ScheduleConflict[]
  suggestions: TimeSlotSuggestion[]
}

export interface ConflictCheckInput {
  startDateTime: string
  endDateTime: string
  attendees: string[]
  excludeScheduleId?: string
}

export type ConflictResolution = 
  | 'force'
  | 'cancel'
  | { type: 'reschedule'; timeSlot: TimeSlotSuggestion }

// Real-time Updates
export interface ScheduleUpdate {
  type: 'CREATED' | 'UPDATED' | 'DELETED' | 'CONFLICT'
  schedule: Schedule
  conflictInfo?: {
    conflictingSchedules: Pick<Schedule, 'id' | 'title' | 'startDateTime' | 'endDateTime'>[]
  }
}

// Drag and Drop
export interface DraggedSchedule {
  schedule: Schedule
  originalTimeSlot: TimeSlot
}

export interface TimeSlot {
  start: string // HH:mm format
  end: string   // HH:mm format
}

// UI State
export interface ScheduleViewState {
  viewMode: 'month' | 'week' | 'day' | 'agenda'
  selectedDateRange: DateRange
  selectedProjectIds: string[]
  showAllDay: boolean
  showPrivate: boolean
}

// Store State
export interface ScheduleState extends ScheduleViewState {
  // Schedule data
  schedules: Map<string, Schedule>
  
  // UI state
  selectedSchedule: Schedule | null
  draggedSchedule: Schedule | null
  isLoading: boolean
  error: ApiError | null
  
  // Actions
  setSchedules: (schedules: Schedule[]) => void
  addSchedule: (schedule: Schedule) => void
  updateSchedule: (id: string, updates: Partial<Schedule>) => void
  deleteSchedule: (id: string) => void
  
  // Drag and drop
  startDrag: (schedule: Schedule) => void
  updateDraggedSchedule: (updates: { startDateTime: string; endDateTime: string }) => void
  commitDrag: () => Promise<void>
  cancelDrag: () => void
  
  // Conflict management
  checkConflicts: (schedule: Partial<Schedule>) => Promise<ConflictCheckResult>
  resolveConflict: (scheduleId: string, resolution: ConflictResolution) => void
  
  // Real-time updates
  handleRealtimeUpdate: (update: ScheduleUpdate) => void
}

// API Response
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

export interface ApiError {
  message: string
  code: number
  details?: Record<string, any>
}

// Project Colors
export interface ProjectColor {
  primary: string
  secondary: string
  text: string
}

export const PROJECT_COLORS: Record<string, ProjectColor> = {
  blue: {
    primary: '#3b82f6',
    secondary: '#eff6ff',
    text: '#1e40af'
  },
  green: {
    primary: '#10b981',
    secondary: '#ecfdf5',
    text: '#047857'
  },
  red: {
    primary: '#ef4444',
    secondary: '#fef2f2',
    text: '#dc2626'
  },
  yellow: {
    primary: '#f59e0b',
    secondary: '#fffbeb',
    text: '#d97706'
  },
  purple: {
    primary: '#8b5cf6',
    secondary: '#faf5ff',
    text: '#7c3aed'
  },
  pink: {
    primary: '#ec4899',
    secondary: '#fdf2f8',
    text: '#db2777'
  }
}

// Form validation schemas
export interface ScheduleFormData extends CreateScheduleInput {}

// Component Props
export interface ScheduleCardProps {
  schedule: Schedule
  onEdit: (schedule: Schedule) => void
  onDelete: (scheduleId: string) => void
}

export interface DraggableScheduleProps extends ScheduleCardProps {
  timeSlot: TimeSlot
}

export interface TimeSlotDropZoneProps {
  timeSlot: TimeSlot
  date: Date
}

export interface ConflictResolutionProps {
  conflicts: ConflictCheckResult
  onResolve: (resolution: ConflictResolution) => void
}

export interface ScheduleCreateFormProps {
  initialData?: Partial<CreateScheduleInput>
  onSubmit: (data: CreateScheduleInput) => void
  onCancel: () => void
}

export interface AttendeesSelectorProps {
  value: Omit<ScheduleAttendee, 'userId'>[]
  onChange: (attendees: Omit<ScheduleAttendee, 'userId'>[]) => void
}

// Accessibility
export interface ScheduleAnnouncementProps {
  announcements: string[]
}

export interface AccessibleScheduleGridProps {
  schedules: Map<string, Schedule>
  onScheduleSelect: (scheduleId: string) => void
  onScheduleEdit: (schedule: Schedule) => void
  onScheduleDelete: (scheduleId: string) => void
}

// Performance
export interface VirtualizedScheduleListProps {
  schedules: Schedule[]
  dateRange: DateRange
  itemHeight?: number
  overscanCount?: number
}