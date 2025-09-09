/**
 * State Synchronization Manager
 * Handles bidirectional sync between local state (Zustand) and realtime updates
 */

import type { 
  CalendarUpdateEvent, 
  ProjectUpdateEvent, 
  ConflictResolution,
  RealtimeEvent 
} from '@/types/realtime';

type ResourceType = 'calendar' | 'project';
type OptimisticUpdate = {
  id: string;
  resourceType: ResourceType;
  timestamp: number;
  originalData: any;
  optimisticData: any;
};

export class StateSync {
  private optimisticUpdates = new Map<string, OptimisticUpdate>();
  private stateUpdaters = new Map<string, Function>();
  private rollbackTimers = new Map<string, NodeJS.Timeout>();

  constructor() {
    this.setupStateUpdaters();
  }

  /**
   * Initialize state sync system
   */
  public initialize(): void {
    console.log('StateSync: Initialized successfully');
  }

  /**
   * Apply optimistic update to local state
   */
  public applyOptimisticUpdate(resourceType: ResourceType, updateData: any): void {
    const updateId = `${resourceType}:${updateData.scheduleId || updateData.projectId}:${updateData.timestamp}`;
    
    // Store original state for potential rollback
    const originalData = this.getCurrentState(resourceType, updateData.scheduleId || updateData.projectId);
    
    const optimisticUpdate: OptimisticUpdate = {
      id: updateId,
      resourceType,
      timestamp: updateData.timestamp,
      originalData,
      optimisticData: updateData.data
    };

    this.optimisticUpdates.set(updateId, optimisticUpdate);

    // Apply the optimistic update to state
    this.updateLocalState(resourceType, updateData);

    // Set rollback timer (in case server never responds)
    const rollbackTimer = setTimeout(() => {
      this.rollbackOptimisticUpdate(resourceType, updateData.scheduleId || updateData.projectId);
    }, 30000); // 30 second timeout

    this.rollbackTimers.set(updateId, rollbackTimer);

    console.log(`StateSync: Applied optimistic update ${updateId}`);
  }

  /**
   * Handle incoming realtime update from server
   */
  public handleIncomingUpdate(resourceType: ResourceType, event: CalendarUpdateEvent | ProjectUpdateEvent): void {
    const { payload } = event;
    const resourceId = 'scheduleId' in payload ? payload.scheduleId : payload.projectId;
    
    console.log(`StateSync: Handling incoming ${resourceType} update for ${resourceId}`);

    // Check if we have a pending optimistic update for this resource
    const optimisticUpdateId = this.findOptimisticUpdate(resourceType, resourceId);
    
    if (optimisticUpdateId) {
      // Confirm or adjust optimistic update
      this.confirmOptimisticUpdate(optimisticUpdateId, payload);
    } else {
      // Direct server update, apply immediately
      this.updateLocalState(resourceType, payload);
    }
  }

  /**
   * Rollback an optimistic update
   */
  public rollbackOptimisticUpdate(resourceType: ResourceType, resourceId: string): void {
    const optimisticUpdateId = this.findOptimisticUpdate(resourceType, resourceId);
    
    if (!optimisticUpdateId) {
      console.warn(`StateSync: No optimistic update found for ${resourceType}:${resourceId}`);
      return;
    }

    const optimisticUpdate = this.optimisticUpdates.get(optimisticUpdateId);
    if (!optimisticUpdate) return;

    // Restore original state
    this.restoreOriginalState(optimisticUpdate);

    // Clean up
    this.cleanupOptimisticUpdate(optimisticUpdateId);

    console.log(`StateSync: Rolled back optimistic update ${optimisticUpdateId}`);
  }

  /**
   * Apply conflict resolution to local state
   */
  public applyConflictResolution(resourceType: ResourceType, resolution: ConflictResolution): void {
    if (resolution.mergedData) {
      // Apply the resolved data to local state
      this.updateLocalState(resourceType, {
        action: 'update',
        data: resolution.mergedData,
        version: resolution.version
      });

      console.log(`StateSync: Applied conflict resolution using ${resolution.strategy} strategy`);
    }
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    // Clear all rollback timers
    this.rollbackTimers.forEach(timer => clearTimeout(timer));
    this.rollbackTimers.clear();
    
    // Clear optimistic updates
    this.optimisticUpdates.clear();
    
    console.log('StateSync: Cleaned up successfully');
  }

  /**
   * Setup state updater functions for different resource types
   */
  private setupStateUpdaters(): void {
    // Calendar/Schedule state updater
    this.stateUpdaters.set('calendar', (updateData: any) => {
      if (typeof window !== 'undefined') {
        // Import the schedule store which handles calendar events
        import('@/stores/scheduleStore').then(({ useScheduleStore }) => {
          const store = useScheduleStore.getState();
          
          // Use the existing handleRealtimeUpdate function
          const realtimeUpdate = {
            type: updateData.action.toUpperCase(),
            schedule: {
              id: updateData.scheduleId,
              ...updateData.data,
              version: updateData.version || 1
            },
            timestamp: updateData.timestamp || Date.now()
          } as const;

          store.handleRealtimeUpdate(realtimeUpdate as any);
        }).catch(console.error);

        // Also update the calendar store
        import('@/stores').then(({ useCalendarStore }) => {
          const store = useCalendarStore.getState();
          
          switch (updateData.action) {
            case 'create':
              if (updateData.data) {
                // Transform to Event format
                const event = {
                  id: updateData.scheduleId,
                  title: updateData.data.title,
                  startDate: updateData.data.startDateTime,
                  endDate: updateData.data.endDateTime,
                  description: updateData.data.description,
                  category: updateData.data.category,
                  tenantId: updateData.data.tenantId,
                  projectId: updateData.data.projectId
                };
                
                // Add to events array
                const currentEvents = store.events;
                const newEvents = [...currentEvents, event];
                useCalendarStore.setState({ events: newEvents });
              }
              break;
              
            case 'update':
              if (updateData.data && updateData.scheduleId) {
                const currentEvents = store.events;
                const updatedEvents = currentEvents.map(event => 
                  event.id === updateData.scheduleId 
                    ? {
                        ...event,
                        title: updateData.data.title || event.title,
                        startDate: updateData.data.startDateTime || event.startDate,
                        endDate: updateData.data.endDateTime || event.endDate,
                        description: updateData.data.description || event.description,
                        category: updateData.data.category || event.category
                      }
                    : event
                );
                useCalendarStore.setState({ events: updatedEvents });
              }
              break;
              
            case 'delete':
              const currentEvents = store.events;
              const filteredEvents = currentEvents.filter(event => event.id !== updateData.scheduleId);
              useCalendarStore.setState({ events: filteredEvents });
              break;
          }
        }).catch(console.error);
      }
    });

    // Project state updater
    this.stateUpdaters.set('project', (updateData: any) => {
      if (typeof window !== 'undefined') {
        // Import project store dynamically
        import('@/stores').then(({ useProjectStore }) => {
          const store = useProjectStore.getState();
          
          switch (updateData.action) {
            case 'create':
              if (updateData.data && store.addProject) {
                store.addProject(updateData.data);
              }
              break;
              
            case 'update':
              if (updateData.data && updateData.projectId && store.updateProject) {
                store.updateProject(updateData.projectId, updateData.data);
              }
              break;
              
            case 'delete':
              if (updateData.projectId && store.removeProject) {
                store.removeProject(updateData.projectId);
              }
              break;
          }
        }).catch(console.error);
      }
    });
  }

  /**
   * Update local state using appropriate updater
   */
  private updateLocalState(resourceType: ResourceType, updateData: any): void {
    const updater = this.stateUpdaters.get(resourceType);
    if (updater) {
      updater(updateData);
    } else {
      console.warn(`StateSync: No state updater found for ${resourceType}`);
    }
  }

  /**
   * Get current state for a resource
   */
  private getCurrentState(resourceType: ResourceType, resourceId: string): any {
    // This would get the current state from Zustand stores
    // For now, return null as a placeholder
    return null;
  }

  /**
   * Find optimistic update by resource
   */
  private findOptimisticUpdate(resourceType: ResourceType, resourceId: string): string | null {
    for (const [updateId, update] of this.optimisticUpdates.entries()) {
      if (update.resourceType === resourceType) {
        const checkId = updateId.split(':')[1]; // Extract resource ID from update ID
        if (checkId === resourceId) {
          return updateId;
        }
      }
    }
    return null;
  }

  /**
   * Confirm optimistic update with server response
   */
  private confirmOptimisticUpdate(updateId: string, serverPayload: any): void {
    const optimisticUpdate = this.optimisticUpdates.get(updateId);
    if (!optimisticUpdate) return;

    // Compare optimistic data with server response
    const serverData = serverPayload.data;
    const optimisticData = optimisticUpdate.optimisticData;

    if (this.dataMatches(optimisticData, serverData)) {
      // Optimistic update was correct, just clean up
      console.log(`StateSync: Confirmed optimistic update ${updateId}`);
    } else {
      // Server data differs, apply server version
      console.log(`StateSync: Adjusting optimistic update ${updateId} with server data`);
      this.updateLocalState(optimisticUpdate.resourceType, {
        action: serverPayload.action,
        data: serverData,
        version: serverPayload.version
      });
    }

    // Clean up the optimistic update
    this.cleanupOptimisticUpdate(updateId);
  }

  /**
   * Restore original state before optimistic update
   */
  private restoreOriginalState(optimisticUpdate: OptimisticUpdate): void {
    if (optimisticUpdate.originalData) {
      this.updateLocalState(optimisticUpdate.resourceType, {
        action: 'update',
        data: optimisticUpdate.originalData
      });
    }
  }

  /**
   * Clean up optimistic update resources
   */
  private cleanupOptimisticUpdate(updateId: string): void {
    // Clear rollback timer
    const timer = this.rollbackTimers.get(updateId);
    if (timer) {
      clearTimeout(timer);
      this.rollbackTimers.delete(updateId);
    }

    // Remove optimistic update
    this.optimisticUpdates.delete(updateId);
  }

  /**
   * Check if optimistic data matches server data
   */
  private dataMatches(optimisticData: any, serverData: any): boolean {
    // Simple deep comparison
    // In practice, you might want more sophisticated comparison
    return JSON.stringify(optimisticData) === JSON.stringify(serverData);
  }
}