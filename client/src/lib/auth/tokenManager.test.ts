import { TokenManager, type AuthTokens, type User } from './tokenManager'

// Mock localStorage and sessionStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}

const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}

// Mock global fetch
global.fetch = jest.fn()
global.localStorage = mockLocalStorage as any
global.sessionStorage = mockSessionStorage as any

// Mock window events
const mockDispatchEvent = jest.fn()
global.window = { dispatchEvent: mockDispatchEvent } as any

describe('TokenManager', () => {
  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'member',
    permissions: ['schedule:read', 'project:read'],
    preferences: {
      theme: 'light',
      language: 'ko',
      timezone: 'Asia/Seoul',
      notificationSettings: {
        email: true,
        push: true,
        inApp: true
      }
    },
    lastLoginAt: '2023-01-01T00:00:00Z',
    createdAt: '2023-01-01T00:00:00Z'
  }

  const mockTokens: AuthTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour from now
    tokenType: 'Bearer',
    user: mockUser
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('setTokens', () => {
    it('should store tokens in appropriate storage', () => {
      TokenManager.setTokens(mockTokens)

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'baro_access_token',
        mockTokens.accessToken
      )
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'baro_token_expiry',
        mockTokens.expiresAt.toString()
      )
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'baro_user',
        JSON.stringify(mockTokens.user)
      )
    })
  })

  describe('getAccessToken', () => {
    it('should return access token from sessionStorage', () => {
      mockSessionStorage.getItem.mockReturnValue('mock-access-token')

      const result = TokenManager.getAccessToken()

      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('baro_access_token')
      expect(result).toBe('mock-access-token')
    })

    it('should return null if no token exists', () => {
      mockSessionStorage.getItem.mockReturnValue(null)

      const result = TokenManager.getAccessToken()

      expect(result).toBeNull()
    })
  })

  describe('isTokenValid', () => {
    it('should return true for valid token', () => {
      const futureTime = Date.now() + 10 * 60 * 1000 // 10 minutes from now
      mockSessionStorage.getItem.mockReturnValue('mock-access-token')
      mockLocalStorage.getItem.mockReturnValue(futureTime.toString())

      const result = TokenManager.isTokenValid()

      expect(result).toBe(true)
    })

    it('should return false for expired token', () => {
      const pastTime = Date.now() - 10 * 60 * 1000 // 10 minutes ago
      mockSessionStorage.getItem.mockReturnValue('mock-access-token')
      mockLocalStorage.getItem.mockReturnValue(pastTime.toString())

      const result = TokenManager.isTokenValid()

      expect(result).toBe(false)
    })

    it('should return false for token expiring within 5 minutes', () => {
      const soonToExpire = Date.now() + 3 * 60 * 1000 // 3 minutes from now
      mockSessionStorage.getItem.mockReturnValue('mock-access-token')
      mockLocalStorage.getItem.mockReturnValue(soonToExpire.toString())

      const result = TokenManager.isTokenValid()

      expect(result).toBe(false)
    })

    it('should return false when no token exists', () => {
      mockSessionStorage.getItem.mockReturnValue(null)
      mockLocalStorage.getItem.mockReturnValue(null)

      const result = TokenManager.isTokenValid()

      expect(result).toBe(false)
    })
  })

  describe('getCurrentUser', () => {
    it('should return parsed user from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockUser))

      const result = TokenManager.getCurrentUser()

      expect(result).toEqual(mockUser)
    })

    it('should return null if no user data exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const result = TokenManager.getCurrentUser()

      expect(result).toBeNull()
    })

    it('should return null and log error for invalid JSON', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json')
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const result = TokenManager.getCurrentUser()

      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith('Failed to parse user data:', expect.any(SyntaxError))
      
      consoleSpy.mockRestore()
    })
  })

  describe('clearTokens', () => {
    it('should remove all tokens and user data', () => {
      TokenManager.clearTokens()

      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('baro_access_token')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('baro_token_expiry')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('baro_user')
    })
  })

  describe('refreshToken', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockClear()
    })

    it('should successfully refresh token', async () => {
      const newTokens = { ...mockTokens, accessToken: 'new-access-token' }
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(newTokens)
      })

      const setTokensSpy = jest.spyOn(TokenManager, 'setTokens')

      const result = await TokenManager.refreshToken()

      expect(global.fetch).toHaveBeenCalledWith('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      expect(setTokensSpy).toHaveBeenCalledWith(newTokens)
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        new CustomEvent('auth:token-refreshed', { detail: newTokens })
      )
      expect(result).toEqual(newTokens)

      setTokensSpy.mockRestore()
    })

    it('should clear tokens and dispatch error event on refresh failure', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401
      })

      const clearTokensSpy = jest.spyOn(TokenManager, 'clearTokens')

      await expect(TokenManager.refreshToken()).rejects.toThrow('Token refresh failed')

      expect(clearTokensSpy).toHaveBeenCalled()
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        new CustomEvent('auth:refresh-failed')
      )

      clearTokensSpy.mockRestore()
    })

    it('should prevent concurrent refresh requests', async () => {
      ;(global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve(mockTokens)
        }), 100))
      )

      // Start two concurrent refresh requests
      const promise1 = TokenManager.refreshToken()
      const promise2 = TokenManager.refreshToken()

      // Advance time to complete the mock fetch
      jest.advanceTimersByTime(100)

      const [result1, result2] = await Promise.all([promise1, promise2])

      // Both should return the same result
      expect(result1).toEqual(result2)
      // But fetch should only be called once
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('startAutoRefresh', () => {
    it('should set up interval for token checking', () => {
      const intervalSpy = jest.spyOn(global, 'setInterval')
      
      const intervalId = TokenManager.startAutoRefresh()

      expect(intervalSpy).toHaveBeenCalledWith(expect.any(Function), 60 * 1000)
      expect(intervalId).toBeDefined()

      intervalSpy.mockRestore()
    })

    it('should refresh token when expiring within 10 minutes', () => {
      const soonToExpire = Date.now() + 5 * 60 * 1000 // 5 minutes from now
      mockLocalStorage.getItem.mockReturnValue(soonToExpire.toString())
      
      const refreshTokenSpy = jest.spyOn(TokenManager, 'refreshToken').mockResolvedValue(mockTokens)

      TokenManager.startAutoRefresh()

      // Advance timer to trigger the interval
      jest.advanceTimersByTime(60 * 1000)

      expect(refreshTokenSpy).toHaveBeenCalled()

      refreshTokenSpy.mockRestore()
    })

    it('should redirect to login when token is expired', () => {
      const expiredTime = Date.now() - 5 * 60 * 1000 // 5 minutes ago
      mockLocalStorage.getItem.mockReturnValue(expiredTime.toString())
      
      // Mock window.location with assign method
      const mockLocationAssign = jest.fn()
      delete (window as any).location
      window.location = { href: '', assign: mockLocationAssign } as any

      const clearTokensSpy = jest.spyOn(TokenManager, 'clearTokens')

      TokenManager.startAutoRefresh()

      // Advance timer to trigger the interval
      jest.advanceTimersByTime(60 * 1000)

      expect(clearTokensSpy).toHaveBeenCalled()
      expect(window.location.href).toBe('/login')

      clearTokensSpy.mockRestore()
    })
  })

  describe('stopAutoRefresh', () => {
    it('should clear the interval', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval')
      const mockIntervalId = 123 as any

      TokenManager.stopAutoRefresh(mockIntervalId)

      expect(clearIntervalSpy).toHaveBeenCalledWith(mockIntervalId)

      clearIntervalSpy.mockRestore()
    })
  })
})