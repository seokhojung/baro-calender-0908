export interface Event {
  id: string;
  tenant_id: string;
  project_id: string;
  title: string;
  starts_at_utc: string;
  ends_at_utc: string;
  timezone: string;
  is_all_day: boolean;
  rrule_json?: string;
  exdates_json?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface EventOccurrence {
  id: string;
  tenant_id: string;
  event_id: string;
  start_utc: string;
  end_utc: string;
  window_from_utc: string;
  window_to_utc: string;
  generated_at: string;
}

export interface Project {
  id: string;
  tenant_id: string;
  owner_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Member {
  project_id: string;
  user_id: string;
  role: string;
}

export interface CalendarView {
  type: 'month' | 'week';
  currentDate: Date;
}

export interface CalendarFilters {
  projects: string[];
  assignees: string[];
  tags: string[];
}

export interface TimelineParams {
  from: string;
  to: string;
  projects?: string[];
  assignees?: string[];
  tags?: string[];
}
