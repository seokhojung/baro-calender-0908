import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { TokenManager, type AuthTokens, type User, type Permission, type UserRole } from '@/lib/auth/tokenManager'

export interface AuthError extends Error {
  code?: string
  status?: number
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

interface AuthState {
  // Authentication state
  isAuthenticated: boolean
  user: User | null
  isLoading: boolean
  error: AuthError | null
  
  // Login flow state
  loginMethod: 'email' | 'google' | 'github' | null
  requiresTwoFactor: boolean
  twoFactorToken: string | null
  
  // Permissions cache
  permissions: Set<Permission>
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>
  loginWithProvider: (provider: 'google' | 'github') => Promise<void>
  verifyTwoFactor: (token: string, code: string) => Promise<void>
  logout: () => Promise<void>
  checkAuthStatus: () => Promise<void>
  updateUser: (updates: Partial<User>) => void
  
  // Permission checks
  hasPermission: (permission: Permission) => boolean
  hasAnyPermission: (permissions: Permission[]) => boolean
  hasRole: (role: UserRole) => boolean
  
  // Internal state management
  setLoading: (loading: boolean) => void
  setError: (error: AuthError | null) => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // Initial state
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
        loginMethod: null,
        requiresTwoFactor: false,
        twoFactorToken: null,
        permissions: new Set(),
        
        // Login with email/password
        login: async (credentials) => {
          set(state => {
            state.isLoading = true
            state.error = null
          })
          
          try {
            const response = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify(credentials)
            })
            
            const data = await response.json()
            
            if (!response.ok) {
              throw new Error(data.message || 'Login failed')
            }
            
            // Handle 2FA requirement
            if (data.requiresTwoFactor) {
              set(state => {
                state.requiresTwoFactor = true
                state.twoFactorToken = data.twoFactorToken
                state.isLoading = false
              })
              return
            }
            
            // Login successful
            const tokens: AuthTokens = data
            TokenManager.setTokens(tokens)
            
            set(state => {
              state.isAuthenticated = true
              state.user = tokens.user
              state.permissions = new Set(tokens.user.permissions)
              state.loginMethod = 'email'
              state.isLoading = false
              state.requiresTwoFactor = false
              state.twoFactorToken = null
            })
            
            // Start token auto-refresh
            TokenManager.startAutoRefresh()
            
            // Log successful login
            console.info('Login successful:', { userId: tokens.user.id, method: 'email' })
            
          } catch (error) {
            const authError = error as AuthError
            set(state => {
              state.error = authError
              state.isLoading = false
            })
            console.error('Login failed:', authError)
          }
        },
        
        // Social login (OAuth)
        loginWithProvider: async (provider) => {
          set(state => {
            state.isLoading = true
            state.error = null
          })
          
          try {
            // Redirect to OAuth provider
            const authUrl = `/api/auth/${provider}`
            window.location.href = authUrl
            
            // Note: State will be updated on OAuth callback
          } catch (error) {
            const authError = error as AuthError
            set(state => {
              state.error = authError
              state.isLoading = false
            })
            console.error(`${provider} login failed:`, authError)
          }
        },
        
        // Verify 2FA code
        verifyTwoFactor: async (token, code) => {
          set(state => { 
            state.isLoading = true
            state.error = null
          })
          
          try {
            const response = await fetch('/api/auth/2fa/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ token, code })
            })
            
            if (!response.ok) {
              const errorData = await response.json()
              throw new Error(errorData.message || 'Invalid 2FA code')
            }
            
            const tokens: AuthTokens = await response.json()
            TokenManager.setTokens(tokens)
            
            set(state => {
              state.isAuthenticated = true
              state.user = tokens.user
              state.permissions = new Set(tokens.user.permissions)
              state.requiresTwoFactor = false
              state.twoFactorToken = null
              state.isLoading = false
            })
            
            // Start token auto-refresh
            TokenManager.startAutoRefresh()
            
            console.info('2FA verification successful:', { userId: tokens.user.id })
            
          } catch (error) {
            const authError = error as AuthError
            set(state => {
              state.error = authError
              state.isLoading = false
            })
            console.error('2FA verification failed:', authError)
          }
        },
        
        // Logout
        logout: async () => {
          try {
            // Call logout endpoint to invalidate server session
            await fetch('/api/auth/logout', {
              method: 'POST',
              credentials: 'include'
            })
          } catch (error) {
            console.error('Logout API call failed:', error)
            // Continue with client-side logout even if server call fails
          }
          
          // Clear client-side tokens
          TokenManager.clearTokens()
          
          // Reset auth state
          set(state => {
            state.isAuthenticated = false
            state.user = null
            state.permissions = new Set()
            state.loginMethod = null
            state.error = null
            state.requiresTwoFactor = false
            state.twoFactorToken = null
          })
          
          console.info('Logout successful')
        },
        
        // Check authentication status on app startup
        checkAuthStatus: async () => {
          const userStr = localStorage.getItem('baro_user')
          const isTokenValid = TokenManager.isTokenValid()
          
          if (userStr && isTokenValid) {
            try {
              const user = JSON.parse(userStr) as User
              
              set(state => {
                state.isAuthenticated = true
                state.user = user
                state.permissions = new Set(user.permissions)
              })
              
              // Start auto-refresh for valid tokens
              TokenManager.startAutoRefresh()
              
              console.info('Auth status restored from storage:', { userId: user.id })
              
            } catch (error) {
              console.error('Failed to restore auth status:', error)
              TokenManager.clearTokens()
            }
          } else if (userStr || !isTokenValid) {
            // Clear invalid/expired tokens
            TokenManager.clearTokens()
            console.info('Cleared expired authentication data')
          }
        },
        
        // Update user profile
        updateUser: (updates) => {
          set(state => {
            if (state.user) {
              state.user = { ...state.user, ...updates }
              
              // Update localStorage
              localStorage.setItem('baro_user', JSON.stringify(state.user))
              
              // Update permissions if they changed
              if (updates.permissions) {
                state.permissions = new Set(updates.permissions)
              }
            }
          })
        },
        
        // Permission checks
        hasPermission: (permission) => {
          return get().permissions.has(permission)
        },
        
        hasAnyPermission: (permissions) => {
          const userPermissions = get().permissions
          return permissions.some(permission => userPermissions.has(permission))
        },
        
        hasRole: (role) => {
          return get().user?.role === role
        },
        
        // State management helpers
        setLoading: (loading) => {
          set(state => {
            state.isLoading = loading
          })
        },
        
        setError: (error) => {
          set(state => {
            state.error = error
          })
        },
        
        clearError: () => {
          set(state => {
            state.error = null
          })
        }
      }))
    ),
    { name: 'Auth Store' }
  )
)

// Subscribe to token refresh events
if (typeof window !== 'undefined') {
  window.addEventListener('auth:token-refreshed', (event) => {
    const tokens = (event as CustomEvent).detail as AuthTokens
    useAuthStore.getState().updateUser(tokens.user)
    console.info('Token refreshed successfully')
  })
  
  window.addEventListener('auth:refresh-failed', () => {
    useAuthStore.getState().logout()
    console.warn('Token refresh failed, user logged out')
  })
}