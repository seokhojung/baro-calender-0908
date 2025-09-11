export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
  tokenType: 'Bearer'
  user: User
}

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: UserRole
  permissions: Permission[]
  preferences: UserPreferences
  lastLoginAt: string
  createdAt: string
}

export type UserRole = 'admin' | 'manager' | 'member' | 'viewer'

export type Permission = 
  | 'schedule:create' | 'schedule:read' | 'schedule:update' | 'schedule:delete'
  | 'project:create' | 'project:read' | 'project:update' | 'project:delete'
  | 'user:manage' | 'settings:manage'

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  timezone: string
  notificationSettings: {
    email: boolean
    push: boolean
    inApp: boolean
  }
}

export class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = 'baro_access_token'
  private static readonly REFRESH_TOKEN_KEY = 'baro_refresh_token'
  private static readonly TOKEN_EXPIRY_KEY = 'baro_token_expiry'
  private static refreshPromise: Promise<AuthTokens> | null = null
  
  /**
   * Store tokens using hybrid approach: sessionStorage for access token, 
   * httpOnly cookies for refresh token managed by server
   */
  static setTokens(tokens: AuthTokens): void {
    // Access token in sessionStorage (secure, auto-cleared on tab close)
    sessionStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken)
    
    // Refresh token handled by httpOnly cookies from server
    // We only store expiry time for client-side token validity checks
    localStorage.setItem(this.TOKEN_EXPIRY_KEY, tokens.expiresAt.toString())
    
    // User info in localStorage for persistence
    localStorage.setItem('baro_user', JSON.stringify(tokens.user))
  }
  
  /**
   * Get access token from sessionStorage
   */
  static getAccessToken(): string | null {
    return sessionStorage.getItem(this.ACCESS_TOKEN_KEY)
  }
  
  /**
   * Check if current token is valid (not expired with 5min buffer)
   */
  static isTokenValid(): boolean {
    const accessToken = this.getAccessToken()
    const expiryStr = localStorage.getItem(this.TOKEN_EXPIRY_KEY)
    
    if (!accessToken || !expiryStr) return false
    
    const expiry = parseInt(expiryStr)
    const now = Date.now()
    
    // 5 minute buffer for token refresh
    return (expiry - now) > 5 * 60 * 1000
  }
  
  /**
   * Get current user from localStorage
   */
  static getCurrentUser(): User | null {
    try {
      const userStr = localStorage.getItem('baro_user')
      return userStr ? JSON.parse(userStr) : null
    } catch (error) {
      console.error('Failed to parse user data:', error)
      return null
    }
  }
  
  /**
   * Refresh access token using httpOnly refresh token
   * Prevents concurrent refresh requests with promise caching
   */
  static async refreshToken(): Promise<AuthTokens> {
    // Prevent concurrent refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise
    }
    
    this.refreshPromise = this.performTokenRefresh()
    
    try {
      const tokens = await this.refreshPromise
      this.refreshPromise = null
      return tokens
    } catch (error) {
      this.refreshPromise = null
      throw error
    }
  }
  
  /**
   * Internal method to perform actual token refresh
   */
  private static async performTokenRefresh(): Promise<AuthTokens> {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include', // Include httpOnly cookies
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (!response.ok) {
        throw new Error('Token refresh failed')
      }
      
      const tokens: AuthTokens = await response.json()
      this.setTokens(tokens)
      
      // Dispatch refresh success event
      window.dispatchEvent(new CustomEvent('auth:token-refreshed', {
        detail: tokens
      }))
      
      return tokens
    } catch (error) {
      // Clear tokens on refresh failure
      this.clearTokens()
      
      // Dispatch refresh failed event
      window.dispatchEvent(new CustomEvent('auth:refresh-failed'))
      
      throw error
    }
  }
  
  /**
   * Clear all stored tokens and user data
   */
  static clearTokens(): void {
    sessionStorage.removeItem(this.ACCESS_TOKEN_KEY)
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY)
    localStorage.removeItem('baro_user')
  }
  
  /**
   * Start automatic token refresh scheduler
   * Checks every minute and refreshes 10 minutes before expiry
   */
  static startAutoRefresh(): NodeJS.Timeout {
    const checkInterval = setInterval(() => {
      const expiryStr = localStorage.getItem(this.TOKEN_EXPIRY_KEY)
      if (!expiryStr) return
      
      const expiry = parseInt(expiryStr)
      const now = Date.now()
      const timeUntilExpiry = expiry - now
      
      // Refresh 10 minutes before expiry
      if (timeUntilExpiry <= 10 * 60 * 1000 && timeUntilExpiry > 0) {
        this.refreshToken().catch(console.error)
      } else if (timeUntilExpiry <= 0) {
        // Token already expired
        clearInterval(checkInterval)
        this.clearTokens()
        window.location.href = '/login'
      }
    }, 60 * 1000) // Check every minute
    
    return checkInterval
  }
  
  /**
   * Stop automatic token refresh
   */
  static stopAutoRefresh(intervalId: NodeJS.Timeout): void {
    clearInterval(intervalId)
  }
}