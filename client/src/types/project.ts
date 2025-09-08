// Project Types and 8-Color Palette System

export const PROJECT_COLORS = {
  red: { 
    primary: 'hsl(0 84% 60%)', 
    secondary: 'hsl(0 84% 95%)',
    name: '빨강' 
  },
  orange: { 
    primary: 'hsl(25 95% 53%)', 
    secondary: 'hsl(25 95% 95%)',
    name: '주황' 
  },
  amber: { 
    primary: 'hsl(45 93% 47%)', 
    secondary: 'hsl(45 93% 95%)',
    name: '호박' 
  },
  yellow: { 
    primary: 'hsl(60 84% 67%)', 
    secondary: 'hsl(60 84% 95%)',
    name: '노랑' 
  },
  lime: { 
    primary: 'hsl(75 85% 60%)', 
    secondary: 'hsl(75 85% 95%)',
    name: '연두' 
  },
  green: { 
    primary: 'hsl(120 84% 60%)', 
    secondary: 'hsl(120 84% 95%)',
    name: '초록' 
  },
  blue: { 
    primary: 'hsl(210 84% 60%)', 
    secondary: 'hsl(210 84% 95%)',
    name: '파랑' 
  },
  purple: { 
    primary: 'hsl(270 84% 60%)', 
    secondary: 'hsl(270 84% 95%)',
    name: '보라' 
  },
} as const

export type ProjectColor = keyof typeof PROJECT_COLORS

export interface ProjectMember {
  userId: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  permissions: ProjectPermission[]
  joinedAt: string
}

export type ProjectPermission = 
  | 'project:read'
  | 'project:write'
  | 'project:delete'
  | 'project:manage_members'
  | 'event:read'
  | 'event:write'
  | 'event:delete'

export interface ProjectPermissions {
  canRead: boolean
  canWrite: boolean
  canDelete: boolean
  canManageMembers: boolean
}

export interface Project {
  id: string
  name: string
  description?: string
  color: ProjectColor
  isActive: boolean
  members: ProjectMember[]
  permissions: ProjectPermissions
  createdAt: string
  updatedAt: string
  order: number
}

// GraphQL Input Types
export interface CreateProjectInput {
  name: string
  description?: string
  color: ProjectColor
  isActive?: boolean
}

export interface UpdateProjectInput {
  name?: string
  description?: string
  color?: ProjectColor
  isActive?: boolean
  order?: number
}

export interface ProjectFilters {
  isActive?: boolean
  colors?: ProjectColor[]
  memberId?: string
}

// Project Update Types for Real-time
export type ProjectUpdateType = 'CREATED' | 'UPDATED' | 'DELETED' | 'REORDERED'

export interface ProjectUpdate {
  id: string
  type: ProjectUpdateType
  project?: Project
  timestamp: string
}

// API Error Types
export interface ApiError {
  message: string
  code: string
  details?: Record<string, any>
}

// Validation helpers
export const validateProjectName = (name: string): boolean => {
  return name.length >= 1 && name.length <= 100
}

export const validateProjectDescription = (description?: string): boolean => {
  return !description || description.length <= 500
}

export const validateProjectColor = (color: string): color is ProjectColor => {
  return color in PROJECT_COLORS
}

export const getProjectColorConfig = (color: ProjectColor) => {
  return PROJECT_COLORS[color]
}

// Permission helpers
export const hasProjectPermission = (
  project: Project,
  permission: ProjectPermission,
  userId: string
): boolean => {
  const member = project.members.find(m => m.userId === userId)
  return member ? member.permissions.includes(permission) : false
}

export const canManageProject = (project: Project, userId: string): boolean => {
  return hasProjectPermission(project, 'project:manage_members', userId)
}

export const canDeleteProject = (project: Project, userId: string): boolean => {
  return hasProjectPermission(project, 'project:delete', userId)
}