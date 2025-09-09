/**
 * RealtimeManager tests
 */

import { RealtimeManager } from '../RealtimeManager';
import { ConnectionManager } from '../ConnectionManager';
import { SyncQueue } from '../SyncQueue';
import { ConflictResolver } from '../ConflictResolver';
import { StateSync } from '../StateSync';

// Mock dependencies
jest.mock('../ConnectionManager');
jest.mock('../SyncQueue');
jest.mock('../ConflictResolver');
jest.mock('../StateSync');

describe('RealtimeManager', () => {
  let manager: RealtimeManager;

  beforeEach(() => {
    // Clear singleton instance
    (RealtimeManager as any).instance = null;
    manager = RealtimeManager.getInstance();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = RealtimeManager.getInstance();
      const instance2 = RealtimeManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should accept config on first instantiation', () => {
      (RealtimeManager as any).instance = null;
      const config = { reconnectionDelay: 2000 };
      const instance = RealtimeManager.getInstance(config);
      expect(instance).toBeDefined();
    });
  });

  describe('Initialization', () => {
    it('should initialize all subsystems', async () => {
      const mockSyncQueue = jest.mocked(SyncQueue.prototype);
      const mockStateSync = jest.mocked(StateSync.prototype);
      const mockConnectionManager = jest.mocked(ConnectionManager.prototype);

      await manager.initialize();

      expect(mockSyncQueue.initialize).toHaveBeenCalled();
      expect(mockStateSync.initialize).toHaveBeenCalled();
      expect(mockConnectionManager.connect).toHaveBeenCalled();
    });

    it('should not initialize twice', async () => {
      const mockSyncQueue = jest.mocked(SyncQueue.prototype);

      await manager.initialize();
      await manager.initialize();

      expect(mockSyncQueue.initialize).toHaveBeenCalledTimes(1);
    });

    it('should handle initialization errors', async () => {
      const mockSyncQueue = jest.mocked(SyncQueue.prototype);
      mockSyncQueue.initialize.mockRejectedValueOnce(new Error('Init failed'));

      await expect(manager.initialize()).rejects.toThrow('Init failed');
    });
  });

  describe('Shutdown', () => {
    it('should shutdown all subsystems', async () => {
      const mockSyncQueue = jest.mocked(SyncQueue.prototype);
      const mockStateSync = jest.mocked(StateSync.prototype);
      const mockConnectionManager = jest.mocked(ConnectionManager.prototype);

      await manager.initialize();
      await manager.shutdown();

      expect(mockSyncQueue.flush).toHaveBeenCalled();
      expect(mockConnectionManager.disconnect).toHaveBeenCalled();
      expect(mockStateSync.cleanup).toHaveBeenCalled();
      expect(mockSyncQueue.cleanup).toHaveBeenCalled();
    });

    it('should handle shutdown when not initialized', async () => {
      await expect(manager.shutdown()).resolves.not.toThrow();
    });
  });

  describe('Connection Status', () => {
    it('should return connection status from ConnectionManager', () => {
      const mockConnectionManager = jest.mocked(ConnectionManager.prototype);
      mockConnectionManager.getStatus.mockReturnValue('connected');

      const status = manager.getConnectionStatus();
      expect(status).toBe('connected');
      expect(mockConnectionManager.getStatus).toHaveBeenCalled();
    });
  });

  describe('Subscriptions', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should subscribe to project updates', () => {
      const mockConnectionManager = jest.mocked(ConnectionManager.prototype);
      
      manager.subscribeToProject('project-1');
      
      expect(mockConnectionManager.joinRoom).toHaveBeenCalledWith('project:project-1');
    });

    it('should unsubscribe from project updates', () => {
      const mockConnectionManager = jest.mocked(ConnectionManager.prototype);
      
      manager.subscribeToProject('project-1');
      manager.unsubscribeFromProject('project-1');
      
      expect(mockConnectionManager.leaveRoom).toHaveBeenCalledWith('project:project-1');
    });

    it('should subscribe to calendar updates', () => {
      const mockConnectionManager = jest.mocked(ConnectionManager.prototype);
      
      manager.subscribeToCalendar('project-1');
      
      expect(mockConnectionManager.joinRoom).toHaveBeenCalledWith('calendar:project-1');
    });

    it('should not subscribe to same project twice', () => {
      const mockConnectionManager = jest.mocked(ConnectionManager.prototype);
      
      manager.subscribeToProject('project-1');
      manager.subscribeToProject('project-1');
      
      expect(mockConnectionManager.joinRoom).toHaveBeenCalledTimes(1);
    });

    it('should throw error when not initialized', () => {
      const uninitializedManager = RealtimeManager.getInstance();
      
      expect(() => uninitializedManager.subscribeToProject('project-1'))
        .toThrow('RealtimeManager not initialized');
    });
  });

  describe('Calendar Updates', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should send calendar update when connected', async () => {
      const mockConnectionManager = jest.mocked(ConnectionManager.prototype);
      const mockStateSync = jest.mocked(StateSync.prototype);
      
      mockConnectionManager.getStatus.mockReturnValue('connected');

      await manager.sendCalendarUpdate('schedule-1', 'project-1', 'create', { title: 'Test Event' });

      expect(mockStateSync.applyOptimisticUpdate).toHaveBeenCalledWith('calendar', expect.any(Object));
      expect(mockConnectionManager.emit).toHaveBeenCalledWith('calendar:update', expect.any(Object));
    });

    it('should queue calendar update when offline', async () => {
      const mockConnectionManager = jest.mocked(ConnectionManager.prototype);
      const mockStateSync = jest.mocked(StateSync.prototype);
      const mockSyncQueue = jest.mocked(SyncQueue.prototype);
      
      mockConnectionManager.getStatus.mockReturnValue('disconnected');

      await manager.sendCalendarUpdate('schedule-1', 'project-1', 'create', { title: 'Test Event' });

      expect(mockStateSync.applyOptimisticUpdate).toHaveBeenCalled();
      expect(mockSyncQueue.enqueue).toHaveBeenCalledWith(expect.objectContaining({
        type: 'calendar:update',
        priority: 'high'
      }));
      expect(mockConnectionManager.emit).not.toHaveBeenCalled();
    });

    it('should rollback on error', async () => {
      const mockStateSync = jest.mocked(StateSync.prototype);
      const mockConnectionManager = jest.mocked(ConnectionManager.prototype);
      
      mockConnectionManager.getStatus.mockReturnValue('connected');
      mockConnectionManager.emit.mockImplementationOnce(() => {
        throw new Error('Network error');
      });

      await expect(manager.sendCalendarUpdate('schedule-1', 'project-1', 'create', { title: 'Test Event' }))
        .rejects.toThrow('Network error');

      expect(mockStateSync.rollbackOptimisticUpdate).toHaveBeenCalledWith('calendar', 'schedule-1');
    });
  });

  describe('Project Updates', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should send project update when connected', async () => {
      const mockConnectionManager = jest.mocked(ConnectionManager.prototype);
      const mockStateSync = jest.mocked(StateSync.prototype);
      
      mockConnectionManager.getStatus.mockReturnValue('connected');

      await manager.sendProjectUpdate('project-1', 'update', { name: 'Updated Project' });

      expect(mockStateSync.applyOptimisticUpdate).toHaveBeenCalledWith('project', expect.any(Object));
      expect(mockConnectionManager.emit).toHaveBeenCalledWith('project:update', expect.any(Object));
    });

    it('should queue project update when offline', async () => {
      const mockConnectionManager = jest.mocked(ConnectionManager.prototype);
      const mockSyncQueue = jest.mocked(SyncQueue.prototype);
      
      mockConnectionManager.getStatus.mockReturnValue('disconnected');

      await manager.sendProjectUpdate('project-1', 'update', { name: 'Updated Project' });

      expect(mockSyncQueue.enqueue).toHaveBeenCalledWith(expect.objectContaining({
        type: 'project:update',
        priority: 'medium'
      }));
    });
  });

  describe('Event Handling', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should handle incoming calendar updates', () => {
      const mockStateSync = jest.mocked(StateSync.prototype);
      const mockConnectionManager = jest.mocked(ConnectionManager.prototype);
      
      // Simulate the connection manager calling the event handler
      const onCalendarUpdate = mockConnectionManager.on.mock.calls
        .find(call => call[0] === 'calendar:update')?.[1];
      
      expect(onCalendarUpdate).toBeDefined();
      
      const updateEvent = {
        type: 'calendar:update',
        payload: { scheduleId: 'schedule-1', action: 'update' },
        timestamp: Date.now(),
        userId: 'user-1'
      };
      
      onCalendarUpdate(updateEvent);
      
      expect(mockStateSync.handleIncomingUpdate).toHaveBeenCalledWith('calendar', updateEvent);
    });

    it('should handle connection status changes', async () => {
      const mockConnectionManager = jest.mocked(ConnectionManager.prototype);
      
      // Find the status change handler
      const onStatusChange = mockConnectionManager.on.mock.calls
        .find(call => call[0] === 'connection:status')?.[1];
      
      expect(onStatusChange).toBeDefined();
      
      // Simulate reconnection
      onStatusChange('connected');
      
      // Should process offline queue (tested separately)
    });
  });
});