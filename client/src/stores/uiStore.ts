import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { UIStore } from '@/types/store';

const useUIStore = create<UIStore>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        isLoading: false,
        error: null,
        lastUpdated: null,
        sidebarOpen: true,
        modalStack: [],
        activeModal: null,
        notifications: [],
        breadcrumb: [],
        theme: 'system',
        compactMode: false,

        // Actions
        setSidebarOpen: (open: boolean) => {
          set({ sidebarOpen: open }, false, 'ui/setSidebarOpen');
        },

        toggleSidebar: () => {
          set((state) => ({ 
            sidebarOpen: !state.sidebarOpen 
          }), false, 'ui/toggleSidebar');
        },

        openModal: (modalId: string) => {
          set((state) => ({
            modalStack: [...state.modalStack, modalId],
            activeModal: modalId
          }), false, 'ui/openModal');
        },

        closeModal: (modalId?: string) => {
          set((state) => {
            let newModalStack = [...state.modalStack];
            
            if (modalId) {
              // Close specific modal
              newModalStack = newModalStack.filter(id => id !== modalId);
            } else {
              // Close the topmost modal
              newModalStack.pop();
            }
            
            return {
              modalStack: newModalStack,
              activeModal: newModalStack[newModalStack.length - 1] || null
            };
          }, false, 'ui/closeModal');
        },

        closeAllModals: () => {
          set({
            modalStack: [],
            activeModal: null
          }, false, 'ui/closeAllModals');
        },

        addNotification: (notification: Omit<UIStore['notifications'][0], 'id' | 'createdAt'>) => {
          const id = Math.random().toString(36).substr(2, 9);
          const newNotification = {
            ...notification,
            id,
            createdAt: new Date()
          };
          
          set((state) => ({
            notifications: [...state.notifications, newNotification]
          }), false, 'ui/addNotification');
          
          // Auto-remove notification after duration
          if (notification.duration && notification.duration > 0) {
            setTimeout(() => {
              get().removeNotification(id);
            }, notification.duration);
          }
        },

        removeNotification: (id: string) => {
          set((state) => ({
            notifications: state.notifications.filter(notification => notification.id !== id)
          }), false, 'ui/removeNotification');
        },

        clearNotifications: () => {
          set({ notifications: [] }, false, 'ui/clearNotifications');
        },

        setBreadcrumb: (breadcrumb: UIStore['breadcrumb']) => {
          set({ breadcrumb }, false, 'ui/setBreadcrumb');
        },

        setTheme: (theme: UIStore['theme']) => {
          set({ theme }, false, 'ui/setTheme');
        },

        setCompactMode: (compact: boolean) => {
          set({ compactMode: compact }, false, 'ui/setCompactMode');
        },

        setLoading: (loading: boolean) => {
          set({ isLoading: loading }, false, 'ui/setLoading');
        },

        setError: (error: string | null) => {
          set({ error }, false, 'ui/setError');
        }
      }),
      {
        name: 'ui-store',
        version: 1,
        partialize: (state) => ({
          sidebarOpen: state.sidebarOpen,
          theme: state.theme,
          compactMode: state.compactMode,
          breadcrumb: state.breadcrumb,
          // Don't persist modal state, notifications, loading states
        })
      }
    ),
    {
      name: 'ui-store'
    }
  )
);

// Selectors
export const useUISelectors = () => {
  const store = useUIStore();
  
  return {
    isModalOpen: (modalId: string) => {
      return store.modalStack.includes(modalId);
    },
    
    getActiveNotifications: () => {
      // Return notifications sorted by creation date (newest first)
      return [...store.notifications].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
    
    getNotificationsByType: (type: UIStore['notifications'][0]['type']) => {
      return store.notifications.filter(notification => notification.type === type);
    },
    
    hasUnreadNotifications: () => {
      return store.notifications.length > 0;
    },
    
    getModalDepth: () => {
      return store.modalStack.length;
    },
    
    isTopModal: (modalId: string) => {
      return store.activeModal === modalId;
    },
    
    getBreadcrumbPath: () => {
      return store.breadcrumb.map(item => item.label).join(' / ');
    }
  };
};

// Notification helpers
export const useNotifications = () => {
  const addNotification = useUIStore(state => state.addNotification);
  
  return {
    success: (message: string, duration = 5000) => {
      addNotification({
        type: 'success',
        message,
        duration
      });
    },
    
    error: (message: string, duration = 8000) => {
      addNotification({
        type: 'error',
        message,
        duration
      });
    },
    
    warning: (message: string, duration = 6000) => {
      addNotification({
        type: 'warning',
        message,
        duration
      });
    },
    
    info: (message: string, duration = 4000) => {
      addNotification({
        type: 'info',
        message,
        duration
      });
    }
  };
};

export default useUIStore;