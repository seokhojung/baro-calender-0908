import { SecurityAuditLogger, type SecurityEvent } from './auditLogger'

// Mock fetch
global.fetch = jest.fn()

// Mock navigator
Object.defineProperty(navigator, 'userAgent', {
  value: 'MockUserAgent/1.0',
  writable: true
})

// Mock sessionStorage and localStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
}

const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
}

global.sessionStorage = mockSessionStorage as any
global.localStorage = mockLocalStorage as any

// Mock window.dispatchEvent
const mockDispatchEvent = jest.fn()
global.window = { dispatchEvent: mockDispatchEvent } as any

// Mock console methods
const consoleSpy = {
  info: jest.spyOn(console, 'info').mockImplementation(),
  error: jest.spyOn(console, 'error').mockImplementation(),
  warn: jest.spyOn(console, 'warn').mockImplementation()
}

describe('SecurityAuditLogger', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset environment variable
    process.env.NODE_ENV = 'test'
  })

  afterAll(() => {
    consoleSpy.info.mockRestore()
    consoleSpy.error.mockRestore()
    consoleSpy.warn.mockRestore()
  })

  describe('logSecurityEvent', () => {
    const mockEvent = {
      type: 'login' as const,
      userId: 'user-1',
      userEmail: 'test@example.com',
      severity: 'low' as const,
      details: { method: 'email', success: true }
    }

    it('should log security event successfully', async () => {
      // Mock successful client info and API response
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ ip: '127.0.0.1' })
        })
        .mockResolvedValueOnce({
          ok: true
        })

      mockSessionStorage.getItem.mockReturnValue('mock-session-id')

      await SecurityAuditLogger.logSecurityEvent(mockEvent)

      expect(global.fetch).toHaveBeenCalledWith('/api/client-info', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      expect(global.fetch).toHaveBeenCalledWith('/api/security/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: expect.stringContaining('"type":"login"')
      })
    })

    it('should handle client info fetch failure', async () => {
      ;(global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true
        })

      await SecurityAuditLogger.logSecurityEvent(mockEvent)

      const auditCall = (global.fetch as jest.Mock).mock.calls.find(
        call => call[0] === '/api/security/audit'
      )
      
      expect(auditCall).toBeDefined()
      const body = JSON.parse(auditCall[1].body)
      expect(body.ipAddress).toBe('unknown')
    })

    it('should generate session ID if not exists', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true })
      mockSessionStorage.getItem.mockReturnValue(null)

      await SecurityAuditLogger.logSecurityEvent(mockEvent)

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'baro_session_id',
        expect.stringMatching(/^\d+_[a-z0-9]{9}$/)
      )
    })

    it('should handle high priority events', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true })

      const highPriorityEvent = {
        ...mockEvent,
        severity: 'high' as const
      }

      await SecurityAuditLogger.logSecurityEvent(highPriorityEvent)

      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'security:high-priority-event'
        })
      )
    })

    it('should log to console in development', async () => {
      process.env.NODE_ENV = 'development'
      ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true })

      await SecurityAuditLogger.logSecurityEvent(mockEvent)

      expect(consoleSpy.info).toHaveBeenCalledWith(
        '[Security Audit]',
        expect.objectContaining({ type: 'login' })
      )
    })

    it('should sanitize sensitive data', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true })

      const eventWithSensitiveData = {
        ...mockEvent,
        details: {
          password: 'secret123',
          token: 'bearer-token',
          normalData: 'safe-data'
        }
      }

      await SecurityAuditLogger.logSecurityEvent(eventWithSensitiveData)

      const auditCall = (global.fetch as jest.Mock).mock.calls.find(
        call => call[0] === '/api/security/audit'
      )
      
      const body = JSON.parse(auditCall[1].body)
      expect(body.details.password).toBe('[REDACTED]')
      expect(body.details.token).toBe('[REDACTED]')
      expect(body.details.normalData).toBe('safe-data')
    })
  })

  describe('sendToServerWithRetry', () => {
    const mockEvent: SecurityEvent = {
      type: 'login',
      userId: 'user-1',
      userEmail: 'test@example.com',
      ipAddress: '127.0.0.1',
      userAgent: 'MockUserAgent/1.0',
      timestamp: '2023-01-01T00:00:00Z',
      severity: 'low',
      details: { success: true },
      sessionId: 'mock-session'
    }

    it('should retry failed requests', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({ ok: true })

      await SecurityAuditLogger.logSecurityEvent({
        type: 'login',
        userId: 'user-1',
        severity: 'low',
        details: {}
      })

      expect(global.fetch).toHaveBeenCalledTimes(4) // 1 for client-info + 3 for audit
    })

    it('should store event locally after max retries', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ ip: '127.0.0.1' }) })
        .mockResolvedValue({ ok: false, status: 500 })

      mockLocalStorage.getItem.mockReturnValue('[]')

      await SecurityAuditLogger.logSecurityEvent({
        type: 'login',
        userId: 'user-1',
        severity: 'low',
        details: {}
      })

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'baro_audit_queue',
        expect.stringContaining('"type":"login"')
      )
    })
  })

  describe('sendQueuedEvents', () => {
    it('should send queued events successfully', async () => {
      const queuedEvents = [
        { type: 'login', userId: 'user-1', severity: 'low' },
        { type: 'logout', userId: 'user-1', severity: 'low' }
      ]

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(queuedEvents))
      ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true })

      await SecurityAuditLogger.sendQueuedEvents()

      expect(global.fetch).toHaveBeenCalledWith('/api/security/audit/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(queuedEvents)
      })

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('baro_audit_queue')
    })

    it('should handle empty queue', async () => {
      mockLocalStorage.getItem.mockReturnValue('[]')

      await SecurityAuditLogger.sendQueuedEvents()

      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should handle send failure', async () => {
      const queuedEvents = [{ type: 'login', userId: 'user-1', severity: 'low' }]
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(queuedEvents))
      ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false })

      await SecurityAuditLogger.sendQueuedEvents()

      expect(mockLocalStorage.removeItem).not.toHaveBeenCalled()
    })
  })

  describe('convenience methods', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true })
    })

    it('should log successful login', () => {
      SecurityAuditLogger.logSuccessfulLogin('user-1', 'test@example.com', 'google')

      expect(global.fetch).toHaveBeenCalledWith('/api/security/audit', 
        expect.objectContaining({
          body: expect.stringContaining('"type":"login"')
        })
      )
    })

    it('should log failed login', () => {
      SecurityAuditLogger.logFailedLogin('test@example.com', 'invalid_password', 5)

      expect(global.fetch).toHaveBeenCalledWith('/api/security/audit',
        expect.objectContaining({
          body: expect.stringContaining('"severity":"high"')
        })
      )
    })

    it('should log permission denied', () => {
      SecurityAuditLogger.logPermissionDenied('user-1', '/admin', 'access')

      expect(global.fetch).toHaveBeenCalledWith('/api/security/audit',
        expect.objectContaining({
          body: expect.stringContaining('"type":"permission_denied"')
        })
      )
    })

    it('should log data access', () => {
      SecurityAuditLogger.logDataAccess('user-1', '/api/projects', 'create')

      expect(global.fetch).toHaveBeenCalledWith('/api/security/audit',
        expect.objectContaining({
          body: expect.stringContaining('"type":"data_access"')
        })
      )
    })

    it('should log 2FA setup', () => {
      SecurityAuditLogger.log2FASetup('user-1', true)

      expect(global.fetch).toHaveBeenCalledWith('/api/security/audit',
        expect.objectContaining({
          body: expect.stringContaining('"type":"2fa_setup"')
        })
      )
    })

    it('should log token refresh', () => {
      SecurityAuditLogger.logTokenRefresh('user-1', false)

      expect(global.fetch).toHaveBeenCalledWith('/api/security/audit',
        expect.objectContaining({
          body: expect.stringContaining('"severity":"medium"')
        })
      )
    })

    it('should log suspicious activity', () => {
      SecurityAuditLogger.logSuspiciousActivity('user-1', 'rate_limit_exceeded', {
        requests: 100,
        timeWindow: 60000
      })

      expect(global.fetch).toHaveBeenCalledWith('/api/security/audit',
        expect.objectContaining({
          body: expect.stringContaining('"severity":"high"')
        })
      )
    })
  })

  describe('data sanitization', () => {
    it('should sanitize nested sensitive data', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true })

      const eventWithNestedSensitive = {
        type: 'data_access' as const,
        userId: 'user-1',
        severity: 'low' as const,
        details: {
          request: {
            headers: {
              authorization: 'Bearer secret-token',
              'content-type': 'application/json'
            },
            body: {
              password: 'secret123',
              username: 'testuser'
            }
          }
        }
      }

      await SecurityAuditLogger.logSecurityEvent(eventWithNestedSensitive)

      const auditCall = (global.fetch as jest.Mock).mock.calls.find(
        call => call[0] === '/api/security/audit'
      )
      
      const body = JSON.parse(auditCall[1].body)
      expect(body.details.request.headers.authorization).toBe('[REDACTED]')
      expect(body.details.request.headers['content-type']).toBe('application/json')
      expect(body.details.request.body.password).toBe('[REDACTED]')
      expect(body.details.request.body.username).toBe('testuser')
    })

    it('should handle arrays with sensitive data', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true })

      const eventWithArrays = {
        type: 'login' as const,
        userId: 'user-1',
        severity: 'low' as const,
        details: {
          attempts: [
            { password: 'wrong1', timestamp: '2023-01-01' },
            { password: 'wrong2', timestamp: '2023-01-02' }
          ]
        }
      }

      await SecurityAuditLogger.logSecurityEvent(eventWithArrays)

      const auditCall = (global.fetch as jest.Mock).mock.calls.find(
        call => call[0] === '/api/security/audit'
      )
      
      const body = JSON.parse(auditCall[1].body)
      expect(body.details.attempts[0].password).toBe('[REDACTED]')
      expect(body.details.attempts[1].password).toBe('[REDACTED]')
      expect(body.details.attempts[0].timestamp).toBe('2023-01-01')
    })
  })
})