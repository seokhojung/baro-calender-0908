import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { UserStore, User } from '@/types/store';

// Mock API functions
const mockAPI = {
  login: async (credentials: { email: string; password: string }): Promise<{ user: User; token: string }> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (credentials.email === 'demo@example.com' && credentials.password === 'password') {
      return {
        token: 'mock-jwt-token',
        user: {
          id: '1',
          email: 'demo@example.com',
          name: 'Demo User',
          avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=3b82f6&color=fff',
          timezone: 'America/New_York',
          preferences: {
            theme: 'system',
            language: 'en',
            dateFormat: 'MM/DD/YYYY',
            timeFormat: '12h',
            weekStartsOn: 0,
            defaultView: 'month',
            notifications: {
              email: true,
              browser: true,
              mobile: false
            }
          },
          subscription: {
            plan: 'pro',
            status: 'active',
            expiresAt: new Date('2025-12-31')
          }
        }
      };
    }
    
    throw new Error('Invalid credentials');
  },
  
  loadUser: async (): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Check if we have a stored token
    const token = localStorage.getItem('auth-token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    return {
      id: '1',
      email: 'demo@example.com',
      name: 'Demo User',
      avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=3b82f6&color=fff',
      timezone: 'America/New_York',
      preferences: {
        theme: 'system',
        language: 'en',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        weekStartsOn: 0,
        defaultView: 'month',
        notifications: {
          email: true,
          browser: true,
          mobile: false
        }
      },
      subscription: {
        plan: 'pro',
        status: 'active',
        expiresAt: new Date('2025-12-31')
      }
    };
  },
  
  updateUser: async (userData: Partial<User>): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    // Return updated user - in real app this would come from server
    return userData as User;
  },
  
  updatePreferences: async (preferences: Partial<User['preferences']>): Promise<User['preferences']> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return preferences as User['preferences'];
  },
  
  logout: async (): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    localStorage.removeItem('auth-token');
  }
};

const useUserStore = create<UserStore>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        isLoading: false,
        error: null,
        lastUpdated: null,
        user: null,
        isAuthenticated: false,
        permissions: [],

        // Actions
        login: async (credentials: { email: string; password: string }) => {
          const { setLoading, setError } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            const { user, token } = await mockAPI.login(credentials);
            
            localStorage.setItem('auth-token', token);
            
            set({
              user,
              isAuthenticated: true,
              permissions: ['read', 'write', 'admin'], // Mock permissions
              lastUpdated: new Date()
            }, false, 'user/login');
            
          } catch (error) {
            setError(error instanceof Error ? error.message : 'Login failed');
            throw error;
          } finally {
            setLoading(false);
          }
        },

        logout: async () => {
          const { setLoading, setError } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            await mockAPI.logout();
            
            set({
              user: null,
              isAuthenticated: false,
              permissions: [],
              lastUpdated: new Date()
            }, false, 'user/logout');
            
          } catch (error) {
            setError(error instanceof Error ? error.message : 'Logout failed');
            throw error;
          } finally {
            setLoading(false);
          }
        },

        loadUser: async () => {
          const { setLoading, setError } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            const user = await mockAPI.loadUser();
            
            set({
              user,
              isAuthenticated: true,
              permissions: ['read', 'write', 'admin'],
              lastUpdated: new Date()
            }, false, 'user/loadUser');
            
          } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to load user');
            // Don't throw - this is often called on app startup
            set({
              user: null,
              isAuthenticated: false,
              permissions: []
            }, false, 'user/loadUserFailed');
          } finally {
            setLoading(false);
          }
        },

        updateUser: async (userData: Partial<User>) => {
          const { setLoading, setError, user } = get();
          
          if (!user) {
            throw new Error('No user to update');
          }
          
          try {
            setLoading(true);
            setError(null);
            
            const updatedUser = await mockAPI.updateUser({ ...user, ...userData });
            
            set({
              user: updatedUser,
              lastUpdated: new Date()
            }, false, 'user/updateUser');
            
          } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to update user');
            throw error;
          } finally {
            setLoading(false);
          }
        },

        updatePreferences: async (preferences: Partial<User['preferences']>) => {
          const { setLoading, setError, user } = get();
          
          if (!user) {
            throw new Error('No user to update preferences for');
          }
          
          try {
            setLoading(true);
            setError(null);
            
            const updatedPreferences = await mockAPI.updatePreferences({
              ...user.preferences,
              ...preferences
            });
            
            set({
              user: {
                ...user,
                preferences: updatedPreferences
              },
              lastUpdated: new Date()
            }, false, 'user/updatePreferences');
            
          } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to update preferences');
            throw error;
          } finally {
            setLoading(false);
          }
        },

        setUser: (user: User | null) => {
          set({ user }, false, 'user/setUser');
        },

        setAuthenticated: (authenticated: boolean) => {
          set({ isAuthenticated: authenticated }, false, 'user/setAuthenticated');
        },

        setPermissions: (permissions: string[]) => {
          set({ permissions }, false, 'user/setPermissions');
        },

        setLoading: (loading: boolean) => {
          set({ isLoading: loading }, false, 'user/setLoading');
        },

        setError: (error: string | null) => {
          set({ error }, false, 'user/setError');
        }
      }),
      {
        name: 'user-store',
        version: 1,
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          permissions: state.permissions,
          // Don't persist loading states and errors
        })
      }
    ),
    {
      name: 'user-store'
    }
  )
);

// Selectors
export const useUserSelectors = () => {
  const store = useUserStore();
  
  return {
    getUserPreferences: () => {
      return store.user?.preferences || null;
    },
    
    hasPermission: (permission: string) => {
      return store.permissions.includes(permission);
    },
    
    isSubscriptionActive: () => {
      if (!store.user?.subscription) return false;
      
      const { status, expiresAt } = store.user.subscription;
      
      if (status !== 'active') return false;
      if (!expiresAt) return true; // No expiration date means active
      
      return new Date() < new Date(expiresAt);
    },
    
    getSubscriptionStatus: () => {
      if (!store.user?.subscription) return null;
      
      return {
        ...store.user.subscription,
        isActive: store.user.subscription.status === 'active' && 
                  (!store.user.subscription.expiresAt || 
                   new Date() < new Date(store.user.subscription.expiresAt))
      };
    },
    
    getUserTimezone: () => {
      return store.user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
  };
};

// Named exports for convenient importing  
export { useUserStore, useUserSelectors };

export default useUserStore;