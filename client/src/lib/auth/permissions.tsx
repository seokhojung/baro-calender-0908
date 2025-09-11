"use client"

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import type { Permission, UserRole } from '@/lib/auth/tokenManager'

// Access Denied fallback component
export const AccessDenied: React.FC = () => (
  <div className="flex items-center justify-center min-h-[400px] p-8">
    <div className="text-center space-y-4">
      <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
        <svg
          className="w-8 h-8 text-destructive"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold">접근 권한이 없습니다</h2>
      <p className="text-muted-foreground max-w-md">
        이 기능을 사용하기 위한 권한이 없습니다. 관리자에게 문의하세요.
      </p>
    </div>
  </div>
)

// Login loading skeleton
export const LoginSkeleton: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center space-y-4">
      <div className="w-8 h-8 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-foreground">로그인 확인 중...</p>
    </div>
  </div>
)

// HOC for permission-based access control
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredPermissions: Permission | Permission[],
  options?: {
    fallback?: React.ComponentType
    redirectTo?: string
    requireAll?: boolean
  }
) {
  const ComponentWithPermission = (props: P) => {
    const { hasPermission, hasAnyPermission, isAuthenticated } = useAuthStore()
    const router = useRouter()
    
    const permissions = Array.isArray(requiredPermissions) 
      ? requiredPermissions 
      : [requiredPermissions]
    
    const hasAccess = options?.requireAll 
      ? permissions.every(p => hasPermission(p))
      : hasAnyPermission(permissions)
    
    // Not authenticated
    if (!isAuthenticated) {
      if (options?.redirectTo) {
        router.push(options.redirectTo)
        return null
      }
      return options?.fallback ? <options.fallback /> : <AccessDenied />
    }
    
    // No permission
    if (!hasAccess) {
      return options?.fallback ? <options.fallback /> : <AccessDenied />
    }
    
    return <WrappedComponent {...props} />
  }
  
  ComponentWithPermission.displayName = `withPermission(${WrappedComponent.displayName || WrappedComponent.name})`
  
  return ComponentWithPermission
}

// Permission Gate Props
export interface PermissionGateProps {
  permission?: Permission | Permission[]
  role?: UserRole | UserRole[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

// Permissions Hook with utilities
export function usePermissions() {
  const { hasPermission, hasAnyPermission, hasRole, user } = useAuthStore()
  
  return {
    hasPermission,
    hasAnyPermission,
    hasRole,
    user,
    
    // Convenience methods
    canCreateSchedule: () => hasPermission('schedule:create'),
    canEditSchedule: () => hasPermission('schedule:update'),
    canDeleteSchedule: () => hasPermission('schedule:delete'),
    canViewSchedule: () => hasPermission('schedule:read'),
    
    canCreateProject: () => hasPermission('project:create'),
    canEditProject: () => hasPermission('project:update'),
    canDeleteProject: () => hasPermission('project:delete'),
    canViewProject: () => hasPermission('project:read'),
    
    canManageUsers: () => hasPermission('user:manage'),
    canManageSettings: () => hasPermission('settings:manage'),
    
    isAdmin: () => hasRole('admin'),
    isManager: () => hasRole('manager') || hasRole('admin'),
    isMember: () => hasRole('member'),
    isViewer: () => hasRole('viewer'),
    
    // Conditional rendering component
    PermissionGate: ({ 
      permission, 
      role, 
      children, 
      fallback = null 
    }: PermissionGateProps) => {
      let hasAccess = true
      
      // Check permissions
      if (permission) {
        hasAccess = Array.isArray(permission)
          ? hasAnyPermission(permission)
          : hasPermission(permission)
      }
      
      // Check roles if permissions passed
      if (role && hasAccess) {
        hasAccess = Array.isArray(role)
          ? role.some(r => hasRole(r))
          : hasRole(role)
      }
      
      return hasAccess ? <>{children}</> : <>{fallback}</>
    }
  }
}

// Protected Route Props
export interface ProtectedRouteProps {
  children: React.ReactNode
  permissions?: Permission | Permission[]
  roles?: UserRole | UserRole[]
  redirectTo?: string
  requireAll?: boolean
}

// Protected Route component for page-level protection
export function ProtectedRoute({ 
  children, 
  permissions, 
  roles,
  redirectTo = '/login',
  requireAll = false
}: ProtectedRouteProps) {
  const { isAuthenticated, hasPermission, hasAnyPermission, hasRole } = useAuthStore()
  const router = useRouter()
  
  useEffect(() => {
    // Not authenticated - redirect to login
    if (!isAuthenticated) {
      router.push(redirectTo)
      return
    }
    
    let hasAccess = true
    
    // Check permissions
    if (permissions) {
      const permissionArray = Array.isArray(permissions) ? permissions : [permissions]
      hasAccess = requireAll 
        ? permissionArray.every(p => hasPermission(p))
        : hasAnyPermission(permissionArray)
    }
    
    // Check roles if permissions passed
    if (roles && hasAccess) {
      const roleArray = Array.isArray(roles) ? roles : [roles]
      hasAccess = roleArray.some(role => hasRole(role))
    }
    
    // No access - redirect to unauthorized
    if (!hasAccess) {
      router.push('/unauthorized')
    }
  }, [isAuthenticated, permissions, roles, redirectTo, requireAll, router, hasPermission, hasAnyPermission, hasRole])
  
  // Show loading while checking auth
  if (!isAuthenticated) {
    return <LoginSkeleton />
  }
  
  return <>{children}</>
}

// Role-based component wrapper
export function withRole<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredRoles: UserRole | UserRole[],
  options?: {
    fallback?: React.ComponentType
    redirectTo?: string
  }
) {
  const ComponentWithRole = (props: P) => {
    const { hasRole, isAuthenticated } = useAuthStore()
    const router = useRouter()
    
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
    const hasRequiredRole = roles.some(role => hasRole(role))
    
    // Not authenticated
    if (!isAuthenticated) {
      if (options?.redirectTo) {
        router.push(options.redirectTo)
        return null
      }
      return options?.fallback ? <options.fallback /> : <AccessDenied />
    }
    
    // No role access
    if (!hasRequiredRole) {
      return options?.fallback ? <options.fallback /> : <AccessDenied />
    }
    
    return <WrappedComponent {...props} />
  }
  
  ComponentWithRole.displayName = `withRole(${WrappedComponent.displayName || WrappedComponent.name})`
  
  return ComponentWithRole
}

// Permission checker utility functions
export const PermissionChecker = {
  /**
   * Check if user has specific permission
   */
  hasPermission: (permission: Permission): boolean => {
    return useAuthStore.getState().hasPermission(permission)
  },
  
  /**
   * Check if user has any of the provided permissions
   */
  hasAnyPermission: (permissions: Permission[]): boolean => {
    return useAuthStore.getState().hasAnyPermission(permissions)
  },
  
  /**
   * Check if user has all of the provided permissions
   */
  hasAllPermissions: (permissions: Permission[]): boolean => {
    const { hasPermission } = useAuthStore.getState()
    return permissions.every(permission => hasPermission(permission))
  },
  
  /**
   * Check if user has specific role
   */
  hasRole: (role: UserRole): boolean => {
    return useAuthStore.getState().hasRole(role)
  },
  
  /**
   * Check if user has any of the provided roles
   */
  hasAnyRole: (roles: UserRole[]): boolean => {
    const { hasRole } = useAuthStore.getState()
    return roles.some(role => hasRole(role))
  },
  
  /**
   * Check if user is admin or manager
   */
  isAdminOrManager: (): boolean => {
    const { hasRole } = useAuthStore.getState()
    return hasRole('admin') || hasRole('manager')
  }
}