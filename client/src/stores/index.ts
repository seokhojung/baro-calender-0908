// Store exports
export { default as useCalendarStore, useCalendarSelectors } from './calendarStore';
export { default as useProjectStore, useProjectSelectors } from './projectStore';
export { default as useUserStore, useUserSelectors } from './userStore';
export { default as useUIStore, useUISelectors, useNotifications } from './uiStore';

// Combined store hook for easier access
import useCalendarStore from './calendarStore';
import useProjectStore from './projectStore';
import useUserStore from './userStore';
import useUIStore from './uiStore';

export const useStores = () => ({
  calendar: useCalendarStore(),
  project: useProjectStore(),
  user: useUserStore(),
  ui: useUIStore()
});

// Store initialization hook
export const useInitializeStores = () => {
  const loadProjects = useProjectStore(state => state.loadProjects);
  const loadUser = useUserStore(state => state.loadUser);
  const setTheme = useUIStore(state => state.setTheme);
  
  const initialize = async () => {
    try {
      // Load user first to get preferences
      await loadUser();
      
      // Load projects
      await loadProjects();
      
      // Apply user theme preference if available
      const userStore = useUserStore.getState();
      if (userStore.user?.preferences.theme) {
        setTheme(userStore.user.preferences.theme);
      }
      
    } catch (error) {
      console.warn('Store initialization warning:', error);
      // Don't throw - app should work even if some stores fail to initialize
    }
  };
  
  return { initialize };
};

// Store reset utility (useful for testing or logout)
export const resetAllStores = () => {
  // Clear persisted data
  localStorage.removeItem('calendar-store');
  localStorage.removeItem('project-store');
  localStorage.removeItem('user-store');
  localStorage.removeItem('ui-store');
  
  // Force re-initialization of stores
  window.location.reload();
};