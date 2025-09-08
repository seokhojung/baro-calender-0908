import { ApolloClient, InMemoryCache } from '@apollo/client';
import SyncManager, { initSyncManager, getSyncManager } from '../sync-manager';
import useCalendarStore from '@/stores/calendarStore';
import { Event } from '@/types/store';

// Mock Apollo Client
const mockApolloClient = new ApolloClient({
  cache: new InMemoryCache(),
  connectToDevTools: false,
});

// Mock stores
jest.mock('@/stores/calendarStore');
jest.mock('@/stores/projectStore');
jest.mock('@/stores/userStore');

// Mock Sentry
jest.mock('../sentry', () => ({
  captureError: jest.fn(),
  addBreadcrumb: jest.fn(),
}));

// Mock event data
const mockEvent: Omit<Event, 'id'> = {
  title: 'Test Event',
  description: 'Test Description',
  startDate: new Date('2024-01-15T10:00:00Z'),
  endDate: new Date('2024-01-15T11:00:00Z'),
  allDay: false,
  color: '#3b82f6',
  category: 'work',
};

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

describe('SyncManager', () => {
  let syncManager: SyncManager;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Reset navigator.onLine
    (navigator as any).onLine = true;
    
    // Initialize sync manager
    syncManager = initSyncManager(mockApolloClient);
    
    // Mock calendar store state
    (useCalendarStore as any).getState = jest.fn(() => ({
      events: [],
    }));
    
    (useCalendarStore as any).setState = jest.fn();
  });

  describe('Initialization', () => {
    test('should initialize sync manager as singleton', () => {
      const manager1 = initSyncManager(mockApolloClient);
      const manager2 = getSyncManager();
      
      expect(manager1).toBe(manager2);
    });

    test('should load offline queue from localStorage', () => {
      const mockQueue = JSON.stringify([
        {
          id: 'op-1',
          type: 'CREATE',
          entity: 'EVENT',
          data: mockEvent,
          timestamp: Date.now(),
          retries: 0,
          maxRetries: 3,
        },
      ]);
      
      localStorageMock.getItem.mockReturnValue(mockQueue);
      
      const manager = new SyncManager(mockApolloClient);
      const status = manager.getSyncStatus();
      
      expect(status.pendingOperations).toBe(1);
    });
  });

  describe('Online/Offline Status', () => {
    test('should track online status', () => {
      const initialStatus = syncManager.getSyncStatus();
      expect(initialStatus.isOnline).toBe(true);

      // Simulate going offline
      (navigator as any).onLine = false;
      window.dispatchEvent(new Event('offline'));

      const offlineStatus = syncManager.getSyncStatus();
      expect(offlineStatus.isOnline).toBe(false);
    });

    test('should process pending operations when coming online', () => {
      const processPendingSpy = jest.spyOn(syncManager as any, 'processPendingOperations');
      
      // Simulate coming online
      window.dispatchEvent(new Event('online'));
      
      expect(processPendingSpy).toHaveBeenCalled();
    });
  });

  describe('Optimistic Updates', () => {
    test('should perform optimistic update when online', async () => {
      const optimisticUpdate = jest.fn();
      const rollback = jest.fn();
      const operation = jest.fn().mockResolvedValue({ id: '1', ...mockEvent });

      const result = await syncManager.performOptimisticUpdate(
        operation,
        optimisticUpdate,
        rollback
      );

      expect(optimisticUpdate).toHaveBeenCalled();
      expect(operation).toHaveBeenCalled();
      expect(rollback).not.toHaveBeenCalled();
      expect(result).toEqual({ id: '1', ...mockEvent });
    });

    test('should queue operation when offline', async () => {
      // Set offline status
      (navigator as any).onLine = false;
      syncManager.getSyncStatus().isOnline = false;

      const optimisticUpdate = jest.fn();
      const rollback = jest.fn();
      const operation = jest.fn();

      const queueData = {
        type: 'CREATE' as const,
        entity: 'EVENT' as const,
        data: mockEvent,
      };

      const result = await syncManager.performOptimisticUpdate(
        operation,
        optimisticUpdate,
        rollback,
        queueData
      );

      expect(optimisticUpdate).toHaveBeenCalled();
      expect(operation).not.toHaveBeenCalled();
      expect(rollback).not.toHaveBeenCalled();
      expect(result).toBeNull();
      expect(syncManager.getSyncStatus().pendingOperations).toBe(1);
    });

    test('should rollback on operation failure', async () => {
      const optimisticUpdate = jest.fn();
      const rollback = jest.fn();
      const operation = jest.fn().mockRejectedValue(new Error('Server error'));

      try {
        await syncManager.performOptimisticUpdate(
          operation,
          optimisticUpdate,
          rollback
        );
      } catch (error) {
        // Expected to throw
      }

      expect(optimisticUpdate).toHaveBeenCalled();
      expect(operation).toHaveBeenCalled();
      expect(rollback).toHaveBeenCalled();
    });
  });

  describe('Event Synchronization', () => {
    test('should sync create event with optimistic update', async () => {
      const mockCreatedEvent = { id: '1', ...mockEvent };
      
      // Mock the private method
      syncManager['createEventOnServer'] = jest.fn().mockResolvedValue(mockCreatedEvent);

      await syncManager.syncCreateEvent(mockEvent);

      expect(syncManager['createEventOnServer']).toHaveBeenCalledWith(mockEvent);
    });

    test('should sync update event', async () => {
      const updates = { title: 'Updated Event' };
      const mockUpdatedEvent = { id: '1', ...mockEvent, ...updates };
      
      // Set up initial store state with the event
      (useCalendarStore as any).getState.mockReturnValue({
        events: [{ id: '1', ...mockEvent }],
      });

      // Mock the private method
      syncManager['updateEventOnServer'] = jest.fn().mockResolvedValue(mockUpdatedEvent);

      await syncManager.syncUpdateEvent('1', updates);

      expect(syncManager['updateEventOnServer']).toHaveBeenCalledWith('1', updates);
    });

    test('should sync delete event', async () => {
      const eventToDelete = { id: '1', ...mockEvent };
      
      // Set up initial store state
      (useCalendarStore as any).getState.mockReturnValue({
        events: [eventToDelete],
      });

      // Mock the private method
      syncManager['deleteEventOnServer'] = jest.fn().mockResolvedValue(undefined);

      await syncManager.syncDeleteEvent('1');

      expect(syncManager['deleteEventOnServer']).toHaveBeenCalledWith('1');
    });
  });

  describe('Queue Management', () => {
    test('should save queue to localStorage', () => {
      // Force a queue operation
      const queueOperation = {
        id: 'test-op',
        type: 'CREATE' as const,
        entity: 'EVENT' as const,
        data: mockEvent,
        timestamp: Date.now(),
        retries: 0,
        maxRetries: 3,
      };

      syncManager['queueOperation'](queueOperation);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'offline-queue',
        expect.stringContaining('test-op')
      );
    });

    test('should clear queue', () => {
      syncManager.clearQueue();

      const status = syncManager.getSyncStatus();
      expect(status.pendingOperations).toBe(0);
      expect(status.failedOperations).toBe(0);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('offline-queue', '[]');
    });

    test('should force sync pending operations', async () => {
      const processPendingSpy = jest.spyOn(syncManager as any, 'processPendingOperations');
      
      await syncManager.forcSync();
      
      expect(processPendingSpy).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should identify retryable errors', () => {
      const networkError = { networkError: true };
      const timeoutError = { message: 'timeout' };
      const fetchError = { message: 'Failed to fetch' };
      const internalError = { 
        graphQLErrors: [{ extensions: { code: 'INTERNAL_ERROR' } }] 
      };
      const validationError = { 
        graphQLErrors: [{ extensions: { code: 'BAD_USER_INPUT' } }] 
      };

      expect(syncManager['isRetryableError'](networkError)).toBe(true);
      expect(syncManager['isRetryableError'](timeoutError)).toBe(true);
      expect(syncManager['isRetryableError'](fetchError)).toBe(true);
      expect(syncManager['isRetryableError'](internalError)).toBe(true);
      expect(syncManager['isRetryableError'](validationError)).toBe(false);
    });

    test('should retry failed operations up to max retries', async () => {
      const mockOperation = {
        id: 'retry-test',
        type: 'CREATE' as const,
        entity: 'EVENT' as const,
        data: mockEvent,
        timestamp: Date.now(),
        retries: 2, // Already retried twice
        maxRetries: 3,
      };

      syncManager['offlineQueue'] = [mockOperation];
      
      // Mock executeQueuedOperation to fail
      syncManager['executeQueuedOperation'] = jest.fn().mockRejectedValue(
        { networkError: true }
      );

      await syncManager['processPendingOperations']();

      // Should give up after max retries exceeded
      expect(syncManager.getSyncStatus().failedOperations).toBe(1);
    });
  });

  describe('State Rehydration', () => {
    test('should rehydrate state on initialization', async () => {
      const syncEventsSpy = jest.spyOn(syncManager as any, 'syncEvents').mockResolvedValue(undefined);
      const syncProjectsSpy = jest.spyOn(syncManager as any, 'syncProjects').mockResolvedValue(undefined);
      
      // Mock authenticated user
      jest.doMock('@/stores/userStore', () => ({
        getState: () => ({ isAuthenticated: true }),
      }));

      await syncManager.rehydrateState();

      expect(syncEventsSpy).toHaveBeenCalled();
      expect(syncProjectsSpy).toHaveBeenCalled();
    });

    test('should handle rehydration errors gracefully', async () => {
      const syncEventsSpy = jest.spyOn(syncManager as any, 'syncEvents').mockRejectedValue(
        new Error('Sync failed')
      );

      // Should not throw
      await expect(syncManager.rehydrateState()).resolves.not.toThrow();
      expect(syncEventsSpy).toHaveBeenCalled();
    });
  });

  describe('Visibility Change Handling', () => {
    test('should sync when tab becomes visible and online', () => {
      const processPendingSpy = jest.spyOn(syncManager as any, 'processPendingOperations');
      
      // Simulate tab becoming visible
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        configurable: true,
      });
      
      document.dispatchEvent(new Event('visibilitychange'));

      expect(processPendingSpy).toHaveBeenCalled();
    });

    test('should not sync when offline even if tab becomes visible', () => {
      const processPendingSpy = jest.spyOn(syncManager as any, 'processPendingOperations');
      
      // Set offline
      syncManager.getSyncStatus().isOnline = false;
      
      // Simulate tab becoming visible
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        configurable: true,
      });
      
      document.dispatchEvent(new Event('visibilitychange'));

      expect(processPendingSpy).not.toHaveBeenCalled();
    });
  });
});