// JWT-based Permission System

import { Project, ProjectPermission, hasProjectPermission } from '@/types/project';

// Project permission constants
export const PROJECT_PERMISSIONS = {
  READ: 'project:read',
  WRITE: 'project:write',
  DELETE: 'project:delete',
  MANAGE_MEMBERS: 'project:manage_members',
  EVENT_READ: 'event:read',
  EVENT_WRITE: 'event:write',
  EVENT_DELETE: 'event:delete'
} as const;

// User roles and their default permissions
export const ROLE_PERMISSIONS = {
  owner: [
    PROJECT_PERMISSIONS.READ,
    PROJECT_PERMISSIONS.WRITE,
    PROJECT_PERMISSIONS.DELETE,
    PROJECT_PERMISSIONS.MANAGE_MEMBERS,
    PROJECT_PERMISSIONS.EVENT_READ,
    PROJECT_PERMISSIONS.EVENT_WRITE,
    PROJECT_PERMISSIONS.EVENT_DELETE
  ],
  admin: [
    PROJECT_PERMISSIONS.READ,
    PROJECT_PERMISSIONS.WRITE,
    PROJECT_PERMISSIONS.MANAGE_MEMBERS,
    PROJECT_PERMISSIONS.EVENT_READ,
    PROJECT_PERMISSIONS.EVENT_WRITE,
    PROJECT_PERMISSIONS.EVENT_DELETE
  ],
  member: [
    PROJECT_PERMISSIONS.READ,
    PROJECT_PERMISSIONS.WRITE,
    PROJECT_PERMISSIONS.EVENT_READ,
    PROJECT_PERMISSIONS.EVENT_WRITE
  ],
  viewer: [
    PROJECT_PERMISSIONS.READ,
    PROJECT_PERMISSIONS.EVENT_READ
  ]
} as const;

// Current user context (in a real app, this would come from authentication)
interface User {
  id: string;
  email: string;
  name: string;
  permissions: string[];
  roles: string[];
}

// Mock current user for development
const getCurrentUser = (): User => {
  return {
    id: 'current-user',
    email: 'user@example.com',
    name: 'Current User',
    permissions: [
      PROJECT_PERMISSIONS.READ,
      PROJECT_PERMISSIONS.WRITE,
      PROJECT_PERMISSIONS.DELETE,
      PROJECT_PERMISSIONS.MANAGE_MEMBERS
    ],
    roles: ['owner']
  };
};

/**
 * Check if current user has a specific permission for a project
 */
export const checkProjectPermission = (
  project: Project, 
  permission: ProjectPermission
): boolean => {
  const user = getCurrentUser();
  return hasProjectPermission(project, permission, user.id);
};

/**
 * Check if current user can perform multiple permissions
 */
export const checkProjectPermissions = (
  project: Project,
  permissions: ProjectPermission[]
): boolean => {
  return permissions.every(permission => checkProjectPermission(project, permission));
};

/**
 * Get all permissions for current user on a project
 */
export const getProjectPermissions = (project: Project): ProjectPermission[] => {
  const user = getCurrentUser();
  const member = project.members.find(m => m.userId === user.id);
  return member ? member.permissions : [];
};

/**
 * Check if user has admin-level access to project
 */
export const isProjectAdmin = (project: Project): boolean => {
  return checkProjectPermission(project, 'project:manage_members');
};

/**
 * Check if user is project owner
 */
export const isProjectOwner = (project: Project): boolean => {
  const user = getCurrentUser();
  const member = project.members.find(m => m.userId === user.id);
  return member ? member.role === 'owner' : false;
};

/**
 * Filter projects based on user permissions
 */
export const filterProjectsByPermission = (
  projects: Project[],
  permission: ProjectPermission
): Project[] => {
  return projects.filter(project => checkProjectPermission(project, permission));
};

/**
 * Get user's role in a project
 */
export const getProjectRole = (project: Project): string | null => {
  const user = getCurrentUser();
  const member = project.members.find(m => m.userId === user.id);
  return member ? member.role : null;
};

/**
 * Sanitize project data based on user permissions
 */
export const sanitizeProject = (project: Project): Project => {
  const canRead = checkProjectPermission(project, 'project:read');
  
  if (!canRead) {
    throw new Error('Insufficient permissions to access project');
  }
  
  const canManageMembers = checkProjectPermission(project, 'project:manage_members');
  
  // Remove sensitive member information if user doesn't have manage_members permission
  const sanitizedProject = { ...project };
  
  if (!canManageMembers) {
    sanitizedProject.members = sanitizedProject.members.map(member => ({
      ...member,
      permissions: [] // Hide detailed permissions from regular members
    }));
  }
  
  return sanitizedProject;
};

/**
 * Validate project operation permissions
 */
export const validateProjectOperation = (
  project: Project,
  operation: 'create' | 'read' | 'update' | 'delete' | 'manage_members'
): boolean => {
  switch (operation) {
    case 'create':
      // Anyone can create projects (this would be controlled at app level)
      return true;
      
    case 'read':
      return checkProjectPermission(project, 'project:read');
      
    case 'update':
      return checkProjectPermission(project, 'project:write');
      
    case 'delete':
      return checkProjectPermission(project, 'project:delete');
      
    case 'manage_members':
      return checkProjectPermission(project, 'project:manage_members');
      
    default:
      return false;
  }
};

/**
 * Security headers for API requests
 */
export const getSecurityHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
    'X-Requested-With': 'XMLHttpRequest',
    'X-Client-Version': '1.0.0'
  };
};

/**
 * Get authentication token (mock implementation)
 */
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
};

/**
 * Set authentication token
 */
export const setAuthToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('auth_token', token);
};

/**
 * Remove authentication token
 */
export const removeAuthToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_token');
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

/**
 * XSS prevention utilities
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validate and sanitize project name
 */
export const sanitizeProjectName = (name: string): string => {
  // Remove potentially dangerous characters
  const sanitized = name.replace(/[<>\"'&]/g, '');
  // Limit length
  return sanitized.substring(0, 100).trim();
};

/**
 * Validate and sanitize project description
 */
export const sanitizeProjectDescription = (description: string): string => {
  // Remove potentially dangerous characters
  const sanitized = description.replace(/[<>\"'&]/g, '');
  // Limit length
  return sanitized.substring(0, 500).trim();
};

/**
 * Rate limiting state (client-side)
 */
interface RateLimitState {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const rateLimitState: RateLimitState = {};

/**
 * Simple client-side rate limiting
 */
export const checkRateLimit = (
  operation: string,
  limit: number = 10,
  windowMs: number = 60000 // 1 minute
): boolean => {
  const now = Date.now();
  const state = rateLimitState[operation];
  
  if (!state || now > state.resetTime) {
    rateLimitState[operation] = {
      count: 1,
      resetTime: now + windowMs
    };
    return true;
  }
  
  if (state.count >= limit) {
    return false;
  }
  
  state.count++;
  return true;
};

/**
 * Log security events (in production, this would send to a security monitoring service)
 */
export const logSecurityEvent = (
  event: string,
  details: Record<string, any> = {}
): void => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`Security Event: ${event}`, details);
  }
  
  // In production, send to monitoring service
  // securityMonitoringService.log(event, details);
};

/**
 * Audit trail for project operations
 */
export const auditProjectOperation = (
  operation: string,
  projectId: string,
  userId: string,
  details: Record<string, any> = {}
): void => {
  const auditLog = {
    timestamp: new Date().toISOString(),
    operation,
    projectId,
    userId,
    details,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
    ip: 'unknown' // Would be populated by server
  };
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Audit Log:', auditLog);
  }
  
  // In production, send to audit service
  // auditService.log(auditLog);
};