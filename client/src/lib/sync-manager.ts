import { ApolloClient } from '@apollo/client';
import useCalendarStore from '@/stores/calendarStore';
import useProjectStore from '@/stores/projectStore';
import useUserStore from '@/stores/userStore';
import { Event, Project } from '@/types/store';
import { captureError, addBreadcrumb } from './sentry';

// Offline queue types
interface QueuedOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'EVENT' | 'PROJECT';
  data: any;
  timestamp: number;
  retries: number;
  maxRetries: number;
}

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSync: Date | null;
  pendingOperations: number;
  failedOperations: number;
}

class SyncManager {
  private apolloClient: ApolloClient<any>;
  private offlineQueue: QueuedOperation[] = [];
  private syncStatus: SyncStatus = {
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSync: null,
    pendingOperations: 0,
    failedOperations: 0,
  };
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(apolloClient: ApolloClient<any>) {
    this.apolloClient = apolloClient;
    this.initializeEventListeners();
    this.loadOfflineQueue();
  }

  private initializeEventListeners() {
    // Listen for online/offline status changes
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Listen for visibility changes (tab becomes active)
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }

  private handleOnline() {
    console.log('Connection restored');
    this.syncStatus.isOnline = true;
    addBreadcrumb('Connection restored', 'network');
    this.processPendingOperations();
  }

  private handleOffline() {
    console.log('Connection lost');
    this.syncStatus.isOnline = false;
    addBreadcrumb('Connection lost', 'network');
  }

  private handleVisibilityChange() {
    if (document.visibilityState === 'visible' && this.syncStatus.isOnline) {
      // Tab became active and we're online - sync any pending operations
      this.processPendingOperations();
    }
  }

  // Optimistic updates with fallback
  async performOptimisticUpdate<T>(
    operation: () => Promise<T>,
    optimisticUpdate: () => void,
    rollback: () => void,
    queueData?: {
      type: QueuedOperation['type'];
      entity: QueuedOperation['entity'];
      data: any;
    }
  ): Promise<T | null> {
    const operationId = this.generateOperationId();
    
    try {
      // Apply optimistic update immediately
      optimisticUpdate();
      addBreadcrumb(`Optimistic update applied: ${operationId}`, 'sync');

      if (this.syncStatus.isOnline) {
        // Try to perform the actual operation
        const result = await operation();
        addBreadcrumb(`Server operation completed: ${operationId}`, 'sync');
        return result;
      } else {
        // Queue for later if offline
        if (queueData) {
          this.queueOperation({
            id: operationId,
            ...queueData,
            timestamp: Date.now(),
            retries: 0,
            maxRetries: 3,
          });
        }
        return null;
      }
    } catch (error) {
      // Rollback optimistic update
      rollback();
      addBreadcrumb(`Operation failed, rolled back: ${operationId}`, 'sync');
      
      // Queue for retry if it was a network error
      if (queueData && this.isRetryableError(error)) {
        this.queueOperation({
          id: operationId,
          ...queueData,
          timestamp: Date.now(),
          retries: 0,
          maxRetries: 3,
        });
      } else {
        captureError(error as Error, { operationId, queueData });
        throw error;
      }
      
      return null;
    }
  }

  // Event synchronization methods
  async syncCreateEvent(eventData: Omit<Event, 'id'>): Promise<Event | null> {
    const calendarStore = useCalendarStore.getState();
    const tempEvent: Event = {
      ...eventData,
      id: `temp-${Date.now()}`,
    };

    return this.performOptimisticUpdate(
      () => this.createEventOnServer(eventData),
      () => {
        calendarStore.events.push(tempEvent);
        useCalendarStore.setState({ events: calendarStore.events });
      },
      () => {
        const events = calendarStore.events.filter(e => e.id !== tempEvent.id);
        useCalendarStore.setState({ events });
      },
      {
        type: 'CREATE',
        entity: 'EVENT',
        data: eventData,
      }
    );
  }

  async syncUpdateEvent(eventId: string, updates: Partial<Event>): Promise<Event | null> {
    const calendarStore = useCalendarStore.getState();
    const originalEvent = calendarStore.events.find(e => e.id === eventId);
    
    if (!originalEvent) {
      throw new Error('Event not found for update');
    }

    const updatedEvent = { ...originalEvent, ...updates };

    return this.performOptimisticUpdate(
      () => this.updateEventOnServer(eventId, updates),
      () => {
        const events = calendarStore.events.map(e => 
          e.id === eventId ? updatedEvent : e
        );
        useCalendarStore.setState({ events });
      },
      () => {
        const events = calendarStore.events.map(e => 
          e.id === eventId ? originalEvent : e
        );
        useCalendarStore.setState({ events });
      },
      {
        type: 'UPDATE',
        entity: 'EVENT',
        data: { id: eventId, updates },
      }
    );
  }

  async syncDeleteEvent(eventId: string): Promise<void> {
    const calendarStore = useCalendarStore.getState();
    const eventToDelete = calendarStore.events.find(e => e.id === eventId);
    
    if (!eventToDelete) {
      throw new Error('Event not found for deletion');
    }

    await this.performOptimisticUpdate(
      () => this.deleteEventOnServer(eventId),
      () => {
        const events = calendarStore.events.filter(e => e.id !== eventId);
        useCalendarStore.setState({ events });
      },
      () => {
        const events = [...calendarStore.events, eventToDelete];
        useCalendarStore.setState({ events });
      },
      {
        type: 'DELETE',
        entity: 'EVENT',
        data: { id: eventId },
      }
    );
  }

  // Server operation methods (these would use Apollo mutations)
  private async createEventOnServer(eventData: Omit<Event, 'id'>): Promise<Event> {
    // Mock implementation - replace with actual GraphQL mutation
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      ...eventData,
      id: Math.random().toString(36).substr(2, 9),
    };
  }

  private async updateEventOnServer(eventId: string, updates: Partial<Event>): Promise<Event> {
    // Mock implementation - replace with actual GraphQL mutation
    await new Promise(resolve => setTimeout(resolve, 300));
    return { id: eventId, ...updates } as Event;
  }

  private async deleteEventOnServer(eventId: string): Promise<void> {
    // Mock implementation - replace with actual GraphQL mutation
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Queue management
  private queueOperation(operation: QueuedOperation) {
    this.offlineQueue.push(operation);
    this.syncStatus.pendingOperations = this.offlineQueue.length;
    this.saveOfflineQueue();
    addBreadcrumb(`Operation queued: ${operation.type} ${operation.entity}`, 'sync');
  }

  private async processPendingOperations() {
    if (this.syncStatus.isSyncing || !this.syncStatus.isOnline || this.offlineQueue.length === 0) {
      return;
    }

    this.syncStatus.isSyncing = true;
    addBreadcrumb(`Processing ${this.offlineQueue.length} pending operations`, 'sync');

    const operations = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const operation of operations) {
      try {
        await this.executeQueuedOperation(operation);
        addBreadcrumb(`Queued operation completed: ${operation.id}`, 'sync');
      } catch (error) {
        operation.retries++;
        
        if (operation.retries < operation.maxRetries && this.isRetryableError(error)) {
          // Re-queue for retry
          this.offlineQueue.push(operation);
          addBreadcrumb(`Operation queued for retry: ${operation.id}`, 'sync');
        } else {
          // Give up after max retries
          this.syncStatus.failedOperations++;
          captureError(error as Error, { operation });
          addBreadcrumb(`Operation failed permanently: ${operation.id}`, 'sync');
        }
      }
    }

    this.syncStatus.pendingOperations = this.offlineQueue.length;
    this.syncStatus.lastSync = new Date();
    this.syncStatus.isSyncing = false;
    this.saveOfflineQueue();

    // Schedule retry for failed operations
    if (this.offlineQueue.length > 0) {
      this.scheduleRetry();
    }
  }

  private async executeQueuedOperation(operation: QueuedOperation) {
    switch (operation.entity) {
      case 'EVENT':
        switch (operation.type) {
          case 'CREATE':
            return this.createEventOnServer(operation.data);
          case 'UPDATE':
            return this.updateEventOnServer(operation.data.id, operation.data.updates);
          case 'DELETE':
            return this.deleteEventOnServer(operation.data.id);
        }
        break;
      case 'PROJECT':
        // Similar implementation for projects
        break;
    }
  }

  private scheduleRetry() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
    
    // Exponential backoff
    const baseDelay = 5000; // 5 seconds
    const maxOperationRetries = Math.max(...this.offlineQueue.map(op => op.retries));
    const delay = Math.min(baseDelay * Math.pow(2, maxOperationRetries), 300000); // Max 5 minutes
    
    this.retryTimeout = setTimeout(() => {
      this.processPendingOperations();
    }, delay);
  }

  // State rehydration
  async rehydrateState() {
    const startTime = performance.now();
    
    try {
      addBreadcrumb('Starting state rehydration', 'sync');
      
      // Load persisted store states
      const calendarStore = useCalendarStore.getState();
      const projectStore = useProjectStore.getState();
      const userStore = useUserStore.getState();
      
      // If user is authenticated, sync with server
      if (userStore.isAuthenticated && this.syncStatus.isOnline) {
        await Promise.all([
          this.syncEvents(),
          this.syncProjects(),
        ]);
      }
      
      const duration = performance.now() - startTime;
      addBreadcrumb(`State rehydration completed in ${duration.toFixed(2)}ms`, 'sync');
      
    } catch (error) {
      captureError(error as Error, { context: 'state-rehydration' });
      console.warn('State rehydration failed:', error);
    }
  }

  private async syncEvents() {
    const calendarStore = useCalendarStore.getState();
    // Implementation would fetch events from server and merge with local state
    // This is a placeholder
    addBreadcrumb('Events synced', 'sync');
  }

  private async syncProjects() {
    const projectStore = useProjectStore.getState();
    // Implementation would fetch projects from server and merge with local state
    // This is a placeholder
    addBreadcrumb('Projects synced', 'sync');
  }

  // Utility methods
  private generateOperationId(): string {
    return `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private isRetryableError(error: any): boolean {
    // Network errors, timeouts, and 5xx server errors are retryable
    return (
      error.networkError ||
      error.message?.includes('timeout') ||
      error.message?.includes('Failed to fetch') ||
      (error.graphQLErrors && error.graphQLErrors.some((e: any) => 
        e.extensions?.code === 'INTERNAL_ERROR'
      ))
    );
  }

  private saveOfflineQueue() {
    try {
      localStorage.setItem('offline-queue', JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.warn('Failed to save offline queue:', error);
    }
  }

  private loadOfflineQueue() {
    try {
      const saved = localStorage.getItem('offline-queue');
      if (saved) {
        this.offlineQueue = JSON.parse(saved);
        this.syncStatus.pendingOperations = this.offlineQueue.length;
      }
    } catch (error) {
      console.warn('Failed to load offline queue:', error);
      this.offlineQueue = [];
    }
  }

  // Public API
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  async forcSync(): Promise<void> {
    await this.processPendingOperations();
  }

  clearQueue(): void {
    this.offlineQueue = [];
    this.syncStatus.pendingOperations = 0;
    this.syncStatus.failedOperations = 0;
    this.saveOfflineQueue();
  }
}

// Singleton instance
let syncManager: SyncManager | null = null;

export const initSyncManager = (apolloClient: ApolloClient<any>): SyncManager => {
  if (!syncManager) {
    syncManager = new SyncManager(apolloClient);
  }
  return syncManager;
};

export const getSyncManager = (): SyncManager => {
  if (!syncManager) {
    throw new Error('SyncManager not initialized. Call initSyncManager first.');
  }
  return syncManager;
};

export default SyncManager;