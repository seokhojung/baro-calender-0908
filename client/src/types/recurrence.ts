// Comprehensive Recurring Schedule Type Definitions for Story 1.8
// RFC 5545 compatible RRULE-based recurrence system

import { Schedule } from './schedule'

// Core Recurrence Types
export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval: number // 1 = 매일/매주/매달, 2 = 이틀마다/격주/격월
  count?: number // 총 반복 횟수
  until?: string // 종료 날짜 (ISO 8601)
  
  // 주간 반복
  byWeekDay?: number[] // [1, 3, 5] = Monday, Wednesday, Friday (0=Sunday)
  weekStartsOn?: 0 | 1 // 0=일요일, 1=월요일
  
  // 월간 반복
  byMonthDay?: number[] // [1, 15] = 매달 1일, 15일
  bySetPos?: number[] // [-1] = 마지막, [1] = 첫째, [2] = 둘째
  
  // 연간 반복
  byMonth?: number[] // [6, 12] = 6월, 12월
  byYearDay?: number[] // [100, 200] = 100번째, 200번째 날
}

export type WeekDay = 'SU' | 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA'

// Recurring Schedule Entity
export interface RecurringSchedule extends Omit<Schedule, 'startDateTime' | 'endDateTime'> {
  // 반복 일정 기본 정보
  recurrenceRule: RecurrenceRule
  startDateTime: string // 첫 번째 발생 시간
  endDateTime: string // 첫 번째 종료 시간
  duration: number // 지속 시간 (분)
  
  // 예외 처리
  exceptions: ScheduleException[]
  modifiedInstances: ScheduleInstance[]
}

// Exception Handling
export interface ScheduleException {
  date: string // 예외 날짜 (YYYY-MM-DD)
  type: 'cancelled' | 'moved'
  originalDateTime?: string
  newDateTime?: string
}

export interface ScheduleInstance {
  originalDate: string // 원래 발생 날짜
  modifiedSchedule: Partial<Schedule> // 수정된 데이터
  modifiedAt: string
}

// Enhanced Schedule Instance for Rendering
export interface EnhancedScheduleInstance extends Schedule {
  parentId: string
  isRecurring: true
  originalDate: string
}

// Recurrence Presets
export interface RecurrencePreset {
  label: string
  rule: RecurrenceRule
  description: string
  category: 'common' | 'work' | 'personal'
}

// Natural Language Processing
export interface RecurrenceNaturalLanguage {
  korean: string
  english: string
  components: {
    frequency: string
    interval?: string
    weekdays?: string
    ending?: string
  }
}

// Conflict Detection for Recurring Schedules
export interface RecurringConflictResult {
  hasConflicts: boolean
  conflicts: ConflictInstance[]
  suggestions: RecurringSuggestion[]
}

export interface ConflictInstance {
  date: string
  conflictingScheduleId: string
  conflictingScheduleTitle: string
  originalScheduleId: string
  severity: 'high' | 'medium' | 'low'
  overlapDuration: number // minutes
}

export interface RecurringSuggestion {
  type: 'time_shift' | 'frequency_change' | 'exception_add'
  description: string
  modifiedRule?: RecurringSchedule
  conflictReduction: number
}

// Edit Scope Types
export type EditScope = 'this' | 'following' | 'all'

export interface RecurringEditOperation {
  type: 'single_instance' | 'following_instances' | 'all_instances'
  instanceId?: string
  parentId: string
  originalDate?: string
  fromDate?: string
  modifications: Partial<Schedule>
}

// Cache Management
export interface RecurrenceCache {
  scheduleId: string
  dateRange: {
    start: string
    end: string
  }
  instances: EnhancedScheduleInstance[]
  generatedAt: number
  expiresAt: number
}

// Performance Metrics
export interface RecurrencePerformanceMetrics {
  generationTime: number // ms
  instanceCount: number
  cacheHitRate: number
  memoryUsage: number // bytes
}

// UI Component Props
export interface RecurrenceFormProps {
  value?: RecurrenceRule
  onChange: (rule: RecurrenceRule) => void
  disabled?: boolean
  showPresets?: boolean
  showAdvanced?: boolean
}

export interface RecurrencePresetSelectorProps {
  onSelect: (rule: RecurrenceRule) => void
  category?: RecurrencePreset['category']
}

export interface EditRecurringInstanceModalProps {
  instance: EnhancedScheduleInstance
  onSave: (operation: RecurringEditOperation) => Promise<void>
  onClose: () => void
}

export interface VirtualizedRecurringSchedulesProps {
  recurringSchedules: RecurringSchedule[]
  dateRange: {
    start: Date
    end: Date
  }
  onInstanceEdit: (instance: EnhancedScheduleInstance) => void
  onInstanceDelete: (instanceId: string, scope: EditScope) => void
  itemHeight?: number
  overscanCount?: number
}

// API Types
export interface CreateRecurringScheduleInput {
  title: string
  description?: string
  startDateTime: string
  endDateTime: string
  duration: number
  projectId: string
  recurrenceRule: RecurrenceRule
  location?: string
  attendees?: string[]
  isPrivate?: boolean
}

export interface UpdateRecurringScheduleInput {
  title?: string
  description?: string
  startDateTime?: string
  endDateTime?: string
  duration?: number
  location?: string
  attendees?: string[]
  status?: Schedule['status']
  isPrivate?: boolean
  recurrenceRule?: RecurrenceRule
}

export interface RecurringScheduleQuery {
  dateRange: {
    start: string
    end: string
  }
  projectIds?: string[]
  expandInstances?: boolean
  includeExceptions?: boolean
}

// Store Integration
export interface RecurrenceState {
  // Data
  recurringSchedules: Map<string, RecurringSchedule>
  scheduleInstances: Map<string, EnhancedScheduleInstance[]>
  
  // Cache
  instanceCache: Map<string, RecurrenceCache>
  
  // UI State
  isGenerating: boolean
  editingInstance: EnhancedScheduleInstance | null
  editScope: EditScope
  error?: { message: string; code: number } | null
  
  // Performance
  performanceMetrics: RecurrencePerformanceMetrics
  
  // Actions
  setRecurringSchedules: (schedules: RecurringSchedule[]) => void
  addRecurringSchedule: (schedule: RecurringSchedule) => void
  updateRecurringSchedule: (
    id: string, 
    updates: UpdateRecurringScheduleInput, 
    scope: EditScope,
    fromDate?: string
  ) => Promise<void>
  deleteRecurringSchedule: (id: string, scope: EditScope, instanceDate?: string) => Promise<void>
  
  // Instance Management
  generateInstances: (
    recurringSchedule: RecurringSchedule,
    dateRange: { start: Date; end: Date }
  ) => Promise<EnhancedScheduleInstance[]>
  
  // Exception Handling
  addException: (scheduleId: string, exception: ScheduleException) => void
  removeException: (scheduleId: string, date: string) => void
  
  // Conflict Detection
  detectRecurringConflicts: (
    schedule: RecurringSchedule,
    dateRange: { start: Date; end: Date }
  ) => Promise<RecurringConflictResult>
  
  // Cache Management
  getCachedInstances: (scheduleId: string, dateRange: { start: Date; end: Date }) => EnhancedScheduleInstance[] | null
  setCachedInstances: (scheduleId: string, dateRange: { start: Date; end: Date }, instances: EnhancedScheduleInstance[]) => void
  invalidateCache: (scheduleId?: string) => void
  cleanupExpiredCache: () => void
}

// Validation Schemas
export interface RecurrenceValidationRule {
  field: keyof RecurrenceRule
  validator: (value: any, rule: RecurrenceRule) => boolean
  message: string
}

export interface RecurrenceValidationResult {
  isValid: boolean
  errors: Array<{
    field: string
    message: string
  }>
}

// Advanced Features
export interface RecurrenceTemplate {
  id: string
  name: string
  description: string
  rule: RecurrenceRule
  category: string
  isBuiltIn: boolean
  usageCount: number
}

export interface RecurrenceStatistics {
  totalRecurringSchedules: number
  mostUsedFrequency: RecurrenceRule['frequency']
  averageInstancesPerSchedule: number
  exceptionRate: number // percentage
  performanceScore: number
}

// Real-time Updates
export interface RecurringScheduleUpdate {
  type: 'CREATED' | 'UPDATED' | 'DELETED' | 'INSTANCE_MODIFIED' | 'EXCEPTION_ADDED'
  recurringSchedule: RecurringSchedule
  affectedInstances?: Array<{
    date: string
    operation: 'created' | 'updated' | 'deleted'
  }>
  metadata?: {
    editScope: EditScope
    fromDate?: string
    modifiedBy: string
    timestamp: string
  }
}

// Export commonly used type unions
export type RecurrenceFrequency = RecurrenceRule['frequency']
export type ExceptionType = ScheduleException['type']
export type UpdateScope = EditScope
export type DeleteScope = EditScope

// Default values and constants
export const DEFAULT_RECURRENCE_RULE: RecurrenceRule = {
  frequency: 'weekly',
  interval: 1,
  weekStartsOn: 1 // Monday
}

export const RECURRENCE_PRESETS: RecurrencePreset[] = [
  {
    label: '매일',
    rule: { frequency: 'daily', interval: 1 },
    description: '매일 같은 시간에 반복',
    category: 'common'
  },
  {
    label: '주중 매일',
    rule: { 
      frequency: 'weekly', 
      interval: 1, 
      byWeekDay: [1, 2, 3, 4, 5] // Monday to Friday 
    },
    description: '월요일부터 금요일까지 반복',
    category: 'work'
  },
  {
    label: '매주',
    rule: { frequency: 'weekly', interval: 1 },
    description: '매주 같은 요일에 반복',
    category: 'common'
  },
  {
    label: '격주',
    rule: { frequency: 'weekly', interval: 2 },
    description: '2주마다 같은 요일에 반복',
    category: 'common'
  },
  {
    label: '매월',
    rule: { frequency: 'monthly', interval: 1 },
    description: '매월 같은 날짜에 반복',
    category: 'common'
  },
  {
    label: '분기별',
    rule: { frequency: 'monthly', interval: 3 },
    description: '3개월마다 반복',
    category: 'work'
  },
  {
    label: '매년',
    rule: { frequency: 'yearly', interval: 1 },
    description: '매년 같은 날짜에 반복',
    category: 'personal'
  }
]

export const WEEKDAY_KOREAN_MAP: Record<WeekDay, string> = {
  'SU': '일',
  'MO': '월',
  'TU': '화',
  'WE': '수',
  'TH': '목',
  'FR': '금',
  'SA': '토'
}

export const FREQUENCY_KOREAN_MAP: Record<RecurrenceRule['frequency'], string> = {
  'daily': '매일',
  'weekly': '매주',
  'monthly': '매월',
  'yearly': '매년'
}