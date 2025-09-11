import { act, renderHook } from '@testing-library/react'
import { useAuthStore } from './authStore'
import { TokenManager } from '@/lib/auth/tokenManager'
import type { AuthTokens, User } from '@/lib/auth/tokenManager'

// Mock TokenManager
jest.mock('@/lib/auth/tokenManager', () => ({
  TokenManager: {
    setTokens: jest.fn(),
    clearTokens: jest.fn(),
    startAutoRefresh: jest.fn(),
    isTokenValid: jest.fn(),
    getCurrentUser: jest.fn()
  }
}))

// Mock fetch
global.fetch = jest.fn()

// Mock console methods
const consoleSpy = {
  info: jest.spyOn(console, 'info').mockImplementation(),
  error: jest.spyOn(console, 'error').mockImplementation(),
  warn: jest.spyOn(console, 'warn').mockImplementation()
}

describe('useAuthStore', () => {
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
    expiresAt: Date.now() + 60 * 60 * 1000,
    tokenType: 'Bearer',
    user: mockUser
  }

  beforeEach(() => {
    // Reset store state
    useAuthStore.setState({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,
      loginMethod: null,
      requiresTwoFactor: false,
      twoFactorToken: null,
      permissions: new Set()
    })

    jest.clearAllMocks()
  })

  afterAll(() => {
    consoleSpy.info.mockRestore()
    consoleSpy.error.mockRestore()
    consoleSpy.warn.mockRestore()
  })

  describe('login', () => {
    it('should successfully login with email credentials', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTokens)
      })

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123'
        })
      })

      expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        })
      })

      expect(TokenManager.setTokens).toHaveBeenCalledWith(mockTokens)
      expect(TokenManager.startAutoRefresh).toHaveBeenCalled()
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.loginMethod).toBe('email')
      expect(result.current.isLoading).toBe(false)
    })

    it('should handle 2FA requirement', async () => {
      const twoFactorResponse = {
        requiresTwoFactor: true,
        twoFactorToken: 'mock-2fa-token'
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(twoFactorResponse)
      })

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123'
        })
      })

      expect(result.current.requiresTwoFactor).toBe(true)
      expect(result.current.twoFactorToken).toBe('mock-2fa-token')
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isLoading).toBe(false)
    })

    it('should handle login failure', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ message: 'Invalid credentials' })
      })

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'wrong-password'
        })
      })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.error).toEqual(expect.objectContaining({
        message: 'Invalid credentials'
      }))
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('loginWithProvider', () => {
    it('should redirect to OAuth provider', async () => {
      // Mock window.location
      delete (window as any).location
      window.location = { href: '' } as any

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        await result.current.loginWithProvider('google')
      })

      expect(window.location.href).toBe('/api/auth/google')
    })
  })

  describe('verifyTwoFactor', () => {
    it('should successfully verify 2FA code', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTokens)
      })

      const { result } = renderHook(() => useAuthStore())

      // Set up 2FA state
      act(() => {
        result.current.setLoading(false)
        useAuthStore.setState({
          requiresTwoFactor: true,
          twoFactorToken: 'mock-2fa-token'
        })
      })

      await act(async () => {
        await result.current.verifyTwoFactor('mock-2fa-token', '123456')
      })

      expect(global.fetch).toHaveBeenCalledWith('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token: 'mock-2fa-token', code: '123456' })
      })

      expect(TokenManager.setTokens).toHaveBeenCalledWith(mockTokens)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.requiresTwoFactor).toBe(false)
      expect(result.current.twoFactorToken).toBeNull()
    })

    it('should handle invalid 2FA code', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ message: 'Invalid 2FA code' })
      })

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        await result.current.verifyTwoFactor('mock-2fa-token', '000000')
      })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.error).toEqual(expect.objectContaining({
        message: 'Invalid 2FA code'
      }))
    })
  })

  describe('logout', () => {
    it('should successfully logout', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true })

      const { result } = renderHook(() => useAuthStore())

      // Set authenticated state
      act(() => {
        useAuthStore.setState({
          isAuthenticated: true,
          user: mockUser,
          permissions: new Set(['schedule:read'])
        })
      })

      await act(async () => {
        await result.current.logout()
      })

      expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })

      expect(TokenManager.clearTokens).toHaveBeenCalled()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
      expect(result.current.permissions).toEqual(new Set())
    })

    it('should logout even if API call fails', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useAuthStore())

      // Set authenticated state
      act(() => {
        useAuthStore.setState({
          isAuthenticated: true,
          user: mockUser
        })
      })

      await act(async () => {
        await result.current.logout()
      })

      expect(TokenManager.clearTokens).toHaveBeenCalled()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
    })
  })

  describe('checkAuthStatus', () => {
    it('should restore auth state from valid stored data', async () => {
      ;(TokenManager.isTokenValid as jest.Mock).mockReturnValue(true)
      ;(TokenManager.getCurrentUser as jest.Mock).mockReturnValue(mockUser)

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        await result.current.checkAuthStatus()
      })

      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.permissions).toEqual(new Set(mockUser.permissions))
      expect(TokenManager.startAutoRefresh).toHaveBeenCalled()
    })

    it('should clear invalid tokens', async () => {
      ;(TokenManager.isTokenValid as jest.Mock).mockReturnValue(false)
      ;(TokenManager.getCurrentUser as jest.Mock).mockReturnValue(mockUser)

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        await result.current.checkAuthStatus()
      })

      expect(TokenManager.clearTokens).toHaveBeenCalled()
      expect(result.current.isAuthenticated).toBe(false)
    })
  })

  describe('permission methods', () => {
    beforeEach(() => {
      act(() => {
        useAuthStore.setState({
          isAuthenticated: true,
          user: mockUser,
          permissions: new Set(['schedule:read', 'project:read'])
        })
      })
    })

    it('should check single permission', () => {
      const { result } = renderHook(() => useAuthStore())

      expect(result.current.hasPermission('schedule:read')).toBe(true)
      expect(result.current.hasPermission('schedule:create')).toBe(false)
    })

    it('should check any permission from array', () => {
      const { result } = renderHook(() => useAuthStore())

      expect(result.current.hasAnyPermission(['schedule:read', 'schedule:create'])).toBe(true)
      expect(result.current.hasAnyPermission(['schedule:create', 'schedule:delete'])).toBe(false)
    })

    it('should check user role', () => {
      const { result } = renderHook(() => useAuthStore())

      expect(result.current.hasRole('member')).toBe(true)
      expect(result.current.hasRole('admin')).toBe(false)
    })
  })

  describe('updateUser', () => {
    it('should update user data and permissions', () => {
      const { result } = renderHook(() => useAuthStore())

      // Set initial user state
      act(() => {
        useAuthStore.setState({
          user: mockUser,
          permissions: new Set(mockUser.permissions)
        })
      })

      const updates = {
        name: 'Updated Name',
        permissions: ['schedule:read', 'schedule:create', 'project:read']
      }

      act(() => {
        result.current.updateUser(updates)
      })

      expect(result.current.user?.name).toBe('Updated Name')
      expect(result.current.permissions).toEqual(new Set(updates.permissions))
    })
  })

  describe('state management helpers', () => {
    it('should set loading state', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setLoading(true)
      })

      expect(result.current.isLoading).toBe(true)
    })

    it('should set and clear error state', () => {
      const { result } = renderHook(() => useAuthStore())
      const error = new Error('Test error') as any

      act(() => {
        result.current.setError(error)
      })

      expect(result.current.error).toBe(error)

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })
  })
})