import { ApolloLink, setContext, onError } from '@apollo/client'
import DOMPurify from 'dompurify'
import { TokenManager } from './tokenManager'
import { useAuthStore } from '@/stores/authStore'
import { SecurityAuditLogger } from '@/lib/security/auditLogger'

export class SecurityInterceptor {
  /**
   * Create Apollo Link for secure API requests with token management
   */
  static createAuthLink(): ApolloLink {
    const authLink = setContext(async (_, { headers }) => {
      let token = TokenManager.getAccessToken()
      
      // Check if token needs refresh
      if (!TokenManager.isTokenValid()) {
        try {
          const refreshed = await TokenManager.refreshToken()
          token = refreshed.accessToken
          
          // Log successful token refresh
          const user = TokenManager.getCurrentUser()
          if (user) {
            SecurityAuditLogger.logTokenRefresh(user.id, true)
          }
        } catch (error) {
          console.error('Token refresh failed during API request:', error)
          
          // Log failed token refresh
          const user = TokenManager.getCurrentUser()
          if (user) {
            SecurityAuditLogger.logTokenRefresh(user.id, false)
          }
          
          // Force logout on refresh failure
          useAuthStore.getState().logout()
          throw new Error('Authentication failed')
        }
      }
      
      return {
        headers: {
          ...headers,
          authorization: token ? `Bearer ${token}` : "",
          'X-Requested-With': 'XMLHttpRequest', // CSRF protection
          'X-Client-Version': process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
        }
      }
    })
    
    const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
      const user = TokenManager.getCurrentUser()
      
      if (graphQLErrors) {
        graphQLErrors.forEach(({ message, locations, path, extensions }) => {
          if (extensions?.code === 'UNAUTHENTICATED') {
            console.warn('Authentication error in GraphQL:', message)
            
            // Log authentication failure
            if (user) {
              SecurityAuditLogger.logSecurityEvent({
                type: 'failed_login',
                userId: user.id,
                userEmail: user.email,
                severity: 'medium',
                details: {
                  reason: 'Token expired or invalid',
                  operation: operation.operationName,
                  path: path?.join('.') || 'unknown'
                }
              })
            }
            
            // Force logout
            useAuthStore.getState().logout()
            
          } else if (extensions?.code === 'FORBIDDEN') {
            console.warn('Permission denied in GraphQL:', message)
            
            // Log permission denial
            if (user) {
              SecurityAuditLogger.logPermissionDenied(
                user.id, 
                path?.join('.') || 'unknown',
                operation.operationName || 'unknown'
              )
            }
            
            // Show toast notification
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('auth:permission-denied', {
                detail: { message }
              }))
            }
          }
        })
      }
      
      if (networkError) {
        console.error('Network error in GraphQL:', networkError)
        
        // Handle specific HTTP status codes
        if ('statusCode' in networkError) {
          if (networkError.statusCode === 401) {
            // Unauthorized - force logout
            if (user) {
              SecurityAuditLogger.logSecurityEvent({
                type: 'failed_login',
                userId: user.id,
                severity: 'medium',
                details: {
                  reason: 'HTTP 401 Unauthorized',
                  operation: operation.operationName
                }
              })
            }
            
            useAuthStore.getState().logout()
            
          } else if (networkError.statusCode === 403) {
            // Forbidden - log permission denial
            if (user) {
              SecurityAuditLogger.logPermissionDenied(
                user.id,
                operation.operationName || 'unknown',
                'HTTP request'
              )
            }
          }
        }
      }
    })
    
    return ApolloLink.from([errorLink, authLink])
  }
  
  /**
   * Sanitize user input to prevent XSS attacks
   */
  static sanitizeInput(input: string, options?: {
    allowedTags?: string[]
    allowedAttributes?: string[]
  }): string {
    const config = {
      ALLOWED_TAGS: options?.allowedTags || [],
      ALLOWED_ATTR: options?.allowedAttributes || [],
      REMOVE_DATA_TAG: true,
      REMOVE_UNKNOWN_PROTOCOL: true,
      RETURN_DOM_FRAGMENT: false,
      SANITIZE_DOM: true
    }
    
    return DOMPurify.sanitize(input, config)
  }
  
  /**
   * Sanitize object recursively to prevent XSS in nested data
   */
  static sanitizeObject(obj: any, options?: {
    allowedTags?: string[]
    allowedAttributes?: string[]
  }): any {
    if (typeof obj === 'string') {
      return this.sanitizeInput(obj, options)
    }
    
    if (typeof obj !== 'object' || obj === null) {
      return obj
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item, options))
    }
    
    const sanitized: Record<string, any> = {}
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = this.sanitizeObject(value, options)
    }
    
    return sanitized
  }
  
  /**
   * Get CSRF token from server
   */
  static async getCSRFToken(): Promise<string> {
    try {
      const response = await fetch('/api/csrf-token', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to get CSRF token: ${response.status}`)
      }
      
      const data = await response.json()
      return data.token
    } catch (error) {
      console.error('Failed to get CSRF token:', error)
      throw new Error('Failed to get CSRF token')
    }
  }
  
  /**
   * Create secure fetch wrapper with automatic token and CSRF handling
   */
  static createSecureFetch() {
    return async (url: string, options: RequestInit = {}): Promise<Response> => {
      let token = TokenManager.getAccessToken()
      
      // Refresh token if needed
      if (!TokenManager.isTokenValid()) {
        try {
          const refreshed = await TokenManager.refreshToken()
          token = refreshed.accessToken
        } catch (error) {
          const user = TokenManager.getCurrentUser()
          if (user) {
            SecurityAuditLogger.logTokenRefresh(user.id, false)
          }
          throw new Error('Authentication failed')
        }
      }
      
      // Prepare headers with security measures
      const headers = new Headers(options.headers)
      
      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      }
      
      headers.set('Content-Type', 'application/json')
      headers.set('X-Requested-With', 'XMLHttpRequest')
      headers.set('X-Client-Version', process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0')
      
      // Add CSRF token for state-changing operations
      const isStateChanging = options.method && !['GET', 'HEAD', 'OPTIONS'].includes(options.method.toUpperCase())
      if (isStateChanging) {
        try {
          const csrfToken = await this.getCSRFToken()
          headers.set('X-CSRF-Token', csrfToken)
        } catch (error) {
          console.warn('Could not get CSRF token, continuing without it:', error)
        }
      }
      
      // Sanitize request body if it exists
      let body = options.body
      if (body && typeof body === 'string') {
        try {
          const parsed = JSON.parse(body)
          const sanitized = this.sanitizeObject(parsed)
          body = JSON.stringify(sanitized)
        } catch (error) {
          // Not JSON, leave as is
        }
      }
      
      const secureOptions: RequestInit = {
        ...options,
        headers,
        body,
        credentials: 'include', // Include cookies
      }
      
      try {
        const response = await fetch(url, secureOptions)
        
        // Log data access for successful requests
        if (response.ok) {
          const user = TokenManager.getCurrentUser()
          if (user && options.method && options.method !== 'GET') {
            SecurityAuditLogger.logDataAccess(
              user.id,
              url,
              this.getActionFromMethod(options.method)
            )
          }
        }
        
        return response
      } catch (error) {
        console.error('Secure fetch failed:', error)
        throw error
      }
    }
  }
  
  /**
   * Map HTTP method to action for audit logging
   */
  private static getActionFromMethod(method: string): 'read' | 'create' | 'update' | 'delete' {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'read'
      case 'POST':
        return 'create'
      case 'PUT':
      case 'PATCH':
        return 'update'
      case 'DELETE':
        return 'delete'
      default:
        return 'read'
    }
  }
  
  /**
   * Rate limiting checker for client-side protection
   */
  static createRateLimiter(maxRequests: number, timeWindow: number) {
    const requests = new Map<string, number[]>()
    
    return (identifier: string): boolean => {
      const now = Date.now()
      const windowStart = now - timeWindow
      
      // Get existing requests for this identifier
      const identifierRequests = requests.get(identifier) || []
      
      // Filter out old requests
      const recentRequests = identifierRequests.filter(timestamp => timestamp > windowStart)
      
      // Check if rate limit exceeded
      if (recentRequests.length >= maxRequests) {
        // Log suspicious activity
        const user = TokenManager.getCurrentUser()
        if (user) {
          SecurityAuditLogger.logSuspiciousActivity(user.id, 'rate_limit_exceeded', {
            identifier,
            requests: recentRequests.length,
            maxRequests,
            timeWindow
          })
        }
        return false
      }
      
      // Add current request
      recentRequests.push(now)
      requests.set(identifier, recentRequests)
      
      return true
    }
  }
  
  /**
   * Detect and prevent common security attacks
   */
  static detectSuspiciousActivity(input: any): boolean {
    const suspiciousPatterns = [
      // SQL injection patterns
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      
      // XSS patterns
      /<script[^>]*>[\s\S]*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      
      // Path traversal
      /\.\.[\/\\]/g,
      
      // Command injection
      /[;&|`$()]/g,
    ]
    
    const inputStr = typeof input === 'string' ? input : JSON.stringify(input)
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(inputStr)) {
        // Log suspicious activity
        const user = TokenManager.getCurrentUser()
        if (user) {
          SecurityAuditLogger.logSuspiciousActivity(user.id, 'malicious_input_detected', {
            pattern: pattern.source,
            input: inputStr.substring(0, 100) // Log first 100 chars only
          })
        }
        return true
      }
    }
    
    return false
  }
  
  /**
   * Filter sensitive data for logging
   */
  static filterSensitiveData(data: any): any {
    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'authorization', 
      'credit_card', 'ssn', 'social_security', 'passport',
      'refresh_token', 'access_token', 'api_key'
    ]
    
    if (typeof data !== 'object' || data === null) {
      return data
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.filterSensitiveData(item))
    }
    
    const filtered: Record<string, any> = {}
    
    for (const [key, value] of Object.entries(data)) {
      const keyLower = key.toLowerCase()
      const isSensitive = sensitiveFields.some(field => keyLower.includes(field))
      
      if (isSensitive) {
        filtered[key] = '[REDACTED]'
      } else if (typeof value === 'object') {
        filtered[key] = this.filterSensitiveData(value)
      } else {
        filtered[key] = value
      }
    }
    
    return filtered
  }
}

// Export singleton secure fetch instance
export const secureFetch = SecurityInterceptor.createSecureFetch()

// Export rate limiter instances for common use cases
export const loginRateLimiter = SecurityInterceptor.createRateLimiter(5, 15 * 60 * 1000) // 5 attempts per 15 minutes
export const apiRateLimiter = SecurityInterceptor.createRateLimiter(100, 60 * 1000) // 100 requests per minute