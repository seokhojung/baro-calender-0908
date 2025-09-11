export interface SecurityEvent {
  type: 'login' | 'logout' | 'failed_login' | 'permission_denied' | 'data_access' | '2fa_setup' | 'token_refresh' | 'suspicious_activity'
  userId?: string
  userEmail?: string
  ipAddress: string
  userAgent: string
  timestamp: string
  details: Record<string, any>
  severity: 'low' | 'medium' | 'high' | 'critical'
  sessionId?: string
  resource?: string
}

export class SecurityAuditLogger {
  private static readonly MAX_RETRY_ATTEMPTS = 3
  private static readonly RETRY_DELAY = 1000 // 1 second
  
  /**
   * Log security event to server with retry mechanism
   */
  static async logSecurityEvent(event: Omit<SecurityEvent, 'timestamp' | 'ipAddress' | 'userAgent'>): Promise<void> {
    try {
      // Collect client information
      const clientInfo = await this.getClientInfo()
      
      const securityEvent: SecurityEvent = {
        ...event,
        timestamp: new Date().toISOString(),
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        sessionId: this.getSessionId()
      }
      
      // Log to console for development
      if (process.env.NODE_ENV === 'development') {
        console.info('[Security Audit]', securityEvent)
      }
      
      // Send to server with retry
      await this.sendToServerWithRetry(securityEvent)
      
      // Handle high-priority events
      if (event.severity === 'high' || event.severity === 'critical') {
        this.handleHighPriorityEvent(securityEvent)
      }
      
    } catch (error) {
      console.error('Failed to log security event:', error)
      // Don't throw error to avoid disrupting user experience
    }
  }
  
  /**
   * Get client information
   */
  private static async getClientInfo(): Promise<{ ipAddress: string; userAgent: string }> {
    let ipAddress = 'unknown'
    
    try {
      // Try to get IP from server endpoint
      const response = await fetch('/api/client-info', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const data = await response.json()
        ipAddress = data.ip || 'unknown'
      }
    } catch (error) {
      console.warn('Failed to get client IP:', error)
    }
    
    return {
      ipAddress,
      userAgent: navigator.userAgent || 'unknown'
    }
  }
  
  /**
   * Get or generate session ID
   */
  private static getSessionId(): string {
    let sessionId = sessionStorage.getItem('baro_session_id')
    
    if (!sessionId) {
      sessionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('baro_session_id', sessionId)
    }
    
    return sessionId
  }
  
  /**
   * Send event to server with retry mechanism
   */
  private static async sendToServerWithRetry(event: SecurityEvent, attempt: number = 1): Promise<void> {
    try {
      const response = await fetch('/api/security/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(this.sanitizeEventData(event))
      })
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`)
      }
      
    } catch (error) {
      if (attempt < this.MAX_RETRY_ATTEMPTS) {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * attempt))
        return this.sendToServerWithRetry(event, attempt + 1)
      } else {
        // Store in localStorage as fallback after max retries
        this.storeEventLocally(event)
        throw error
      }
    }
  }
  
  /**
   * Store event locally as fallback
   */
  private static storeEventLocally(event: SecurityEvent): void {
    try {
      const localEvents = JSON.parse(localStorage.getItem('baro_audit_queue') || '[]')
      localEvents.push(event)
      
      // Keep only last 100 events
      if (localEvents.length > 100) {
        localEvents.splice(0, localEvents.length - 100)
      }
      
      localStorage.setItem('baro_audit_queue', JSON.stringify(localEvents))
    } catch (error) {
      console.error('Failed to store event locally:', error)
    }
  }
  
  /**
   * Sanitize event data to remove sensitive information
   */
  private static sanitizeEventData(event: SecurityEvent): SecurityEvent {
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization', 'credit_card']
    
    const sanitizeValue = (value: any): any => {
      if (typeof value === 'string') {
        for (const field of sensitiveFields) {
          if (value.toLowerCase().includes(field)) {
            return '[REDACTED]'
          }
        }
        return value
      }
      
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          return value.map(sanitizeValue)
        } else {
          const sanitized: Record<string, any> = {}
          for (const [key, val] of Object.entries(value)) {
            if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
              sanitized[key] = '[REDACTED]'
            } else {
              sanitized[key] = sanitizeValue(val)
            }
          }
          return sanitized
        }
      }
      
      return value
    }
    
    return {
      ...event,
      details: sanitizeValue(event.details)
    }
  }
  
  /**
   * Handle high-priority security events
   */
  private static handleHighPriorityEvent(event: SecurityEvent): void {
    // Send immediate alert to monitoring system
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('security:high-priority-event', {
        detail: event
      }))
    }
    
    // Log to console with warning
    console.warn('[SECURITY ALERT]', {
      type: event.type,
      severity: event.severity,
      userId: event.userId,
      timestamp: event.timestamp,
      details: event.details
    })
  }
  
  /**
   * Try to send queued events from localStorage
   */
  static async sendQueuedEvents(): Promise<void> {
    try {
      const queuedEvents = JSON.parse(localStorage.getItem('baro_audit_queue') || '[]')
      
      if (queuedEvents.length === 0) return
      
      const response = await fetch('/api/security/audit/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(queuedEvents)
      })
      
      if (response.ok) {
        // Clear queue on successful send
        localStorage.removeItem('baro_audit_queue')
        console.info(`Sent ${queuedEvents.length} queued security events`)
      }
      
    } catch (error) {
      console.error('Failed to send queued events:', error)
    }
  }
  
  // Convenience methods for common events
  static logSuccessfulLogin(userId: string, userEmail: string, method: 'email' | 'google' | 'github' = 'email'): void {
    this.logSecurityEvent({
      type: 'login',
      userId,
      userEmail,
      severity: 'low',
      details: { 
        method,
        success: true,
        timestamp: new Date().toISOString()
      }
    })
  }
  
  static logFailedLogin(email: string, reason: string, attempts?: number): void {
    this.logSecurityEvent({
      type: 'failed_login',
      userEmail: email,
      severity: attempts && attempts > 3 ? 'high' : 'medium',
      details: { 
        reason, 
        success: false,
        attempts: attempts || 1,
        timestamp: new Date().toISOString()
      }
    })
  }
  
  static logLogout(userId: string, userEmail?: string): void {
    this.logSecurityEvent({
      type: 'logout',
      userId,
      userEmail,
      severity: 'low',
      details: { 
        success: true,
        timestamp: new Date().toISOString()
      }
    })
  }
  
  static logPermissionDenied(userId: string, resource: string, action: string): void {
    this.logSecurityEvent({
      type: 'permission_denied',
      userId,
      severity: 'medium',
      resource,
      details: { 
        resource, 
        action,
        timestamp: new Date().toISOString()
      }
    })
  }
  
  static logDataAccess(userId: string, resource: string, action: 'read' | 'create' | 'update' | 'delete'): void {
    this.logSecurityEvent({
      type: 'data_access',
      userId,
      severity: 'low',
      resource,
      details: { 
        resource, 
        action,
        timestamp: new Date().toISOString()
      }
    })
  }
  
  static log2FASetup(userId: string, enabled: boolean): void {
    this.logSecurityEvent({
      type: '2fa_setup',
      userId,
      severity: 'low',
      details: { 
        enabled,
        timestamp: new Date().toISOString()
      }
    })
  }
  
  static logTokenRefresh(userId: string, success: boolean): void {
    this.logSecurityEvent({
      type: 'token_refresh',
      userId,
      severity: success ? 'low' : 'medium',
      details: { 
        success,
        timestamp: new Date().toISOString()
      }
    })
  }
  
  static logSuspiciousActivity(userId: string, activityType: string, details: Record<string, any>): void {
    this.logSecurityEvent({
      type: 'suspicious_activity',
      userId,
      severity: 'high',
      details: {
        activityType,
        ...details,
        timestamp: new Date().toISOString()
      }
    })
  }
}

// Initialize queued events sending when app loads
if (typeof window !== 'undefined') {
  // Send queued events when app becomes online
  window.addEventListener('online', () => {
    SecurityAuditLogger.sendQueuedEvents()
  })
  
  // Send queued events periodically
  setInterval(() => {
    SecurityAuditLogger.sendQueuedEvents()
  }, 5 * 60 * 1000) // Every 5 minutes
}