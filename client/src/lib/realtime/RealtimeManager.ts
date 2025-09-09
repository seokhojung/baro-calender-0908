/**
 * Main Realtime Manager
 * Orchestrates WebSocket connections, state sync, conflict resolution, and offline queue
 */

import { ConnectionManager } from './ConnectionManager';
import { SyncQueue } from './SyncQueue';
import { ConflictResolver } from './ConflictResolver';
import { StateSync } from './StateSync';
import type { 
  CalendarUpdateEvent, 
  ProjectUpdateEvent, 
  ConflictDetectedEvent,
  ConnectionStatus,
  SyncQueueItem,
  RealtimeConfig
} from '@/types/realtime';

export class RealtimeManager {
  private static instance: RealtimeManager | null = null;
  
  private connectionManager: ConnectionManager;
  private syncQueue: SyncQueue;
  private conflictResolver: ConflictResolver;
  private stateSync: StateSync;
  
  private isInitialized = false;
  private subscriptions = new Set<string>();

  private constructor(config?: Partial<RealtimeConfig>) {
    this.connectionManager = new ConnectionManager(config);
    this.syncQueue = new SyncQueue();
    this.conflictResolver = new ConflictResolver();
    this.stateSync = new StateSync();

    this.setupEventHandlers();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: Partial<RealtimeConfig>): RealtimeManager {
    if (!RealtimeManager.instance) {
      RealtimeManager.instance = new RealtimeManager(config);
    }
    return RealtimeManager.instance;
  }

  /**
   * Initialize the realtime sync system
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('RealtimeManager: Already initialized');
      return;
    }

    try {
      // Initialize subsystems
      await this.syncQueue.initialize();
      this.stateSync.initialize();
      
      // Setup connection
      this.connectionManager.connect();
      
      this.isInitialized = true;
      console.log('RealtimeManager: Successfully initialized');
    } catch (error) {
      console.error('RealtimeManager: Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Shutdown the realtime sync system
   */
  public async shutdown(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      // Process remaining queue items
      await this.syncQueue.flush();
      
      // Disconnect
      this.connectionManager.disconnect();
      
      // Cleanup subsystems
      this.stateSync.cleanup();
      await this.syncQueue.cleanup();
      
      this.isInitialized = false;
      console.log('RealtimeManager: Successfully shut down');
    } catch (error) {
      console.error('RealtimeManager: Error during shutdown:', error);
    }
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): ConnectionStatus {
    return this.connectionManager.getStatus();
  }

  /**
   * Subscribe to a project's realtime updates
   */
  public subscribeToProject(projectId: string): void {
    if (!this.isInitialized) {
      throw new Error('RealtimeManager not initialized');
    }

    const roomId = `project:${projectId}`;
    
    if (!this.subscriptions.has(roomId)) {
      this.connectionManager.joinRoom(roomId);
      this.subscriptions.add(roomId);
      console.log(`RealtimeManager: Subscribed to project ${projectId}`);
    }
  }

  /**
   * Unsubscribe from a project's realtime updates
   */
  public unsubscribeFromProject(projectId: string): void {
    const roomId = `project:${projectId}`;
    
    if (this.subscriptions.has(roomId)) {
      this.connectionManager.leaveRoom(roomId);
      this.subscriptions.delete(roomId);
      console.log(`RealtimeManager: Unsubscribed from project ${projectId}`);
    }
  }

  /**
   * Subscribe to a calendar's realtime updates
   */
  public subscribeToCalendar(projectId: string): void {
    if (!this.isInitialized) {
      throw new Error('RealtimeManager not initialized');
    }

    const roomId = `calendar:${projectId}`;
    
    if (!this.subscriptions.has(roomId)) {
      this.connectionManager.joinRoom(roomId);
      this.subscriptions.add(roomId);
      console.log(`RealtimeManager: Subscribed to calendar ${projectId}`);
    }
  }

  /**
   * Unsubscribe from a calendar's realtime updates
   */
  public unsubscribeFromCalendar(projectId: string): void {
    const roomId = `calendar:${projectId}`;
    
    if (this.subscriptions.has(roomId)) {
      this.connectionManager.leaveRoom(roomId);
      this.subscriptions.delete(roomId);
      console.log(`RealtimeManager: Unsubscribed from calendar ${projectId}`);
    }
  }

  /**
   * Send a calendar update with optimistic UI update
   */
  public async sendCalendarUpdate(
    scheduleId: string, 
    projectId: string,
    action: 'create' | 'update' | 'delete',
    data?: any
  ): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('RealtimeManager not initialized');
    }

    const updateData = {
      scheduleId,
      projectId,
      action,
      data,
      version: Date.now(), // Simple versioning
      timestamp: Date.now()
    };

    try {
      // Apply optimistic update to local state
      this.stateSync.applyOptimisticUpdate('calendar', updateData);

      // If online, send immediately
      if (this.connectionManager.getStatus() === 'connected') {
        this.connectionManager.emit('calendar:update', updateData);
      } else {
        // If offline, queue for later
        await this.syncQueue.enqueue({
          id: `calendar:${scheduleId}:${Date.now()}`,
          type: 'calendar:update',
          payload: updateData,
          timestamp: Date.now(),
          retryCount: 0,
          priority: 'high',
          status: 'pending'
        });
      }
    } catch (error) {
      // Rollback optimistic update on error
      this.stateSync.rollbackOptimisticUpdate('calendar', scheduleId);
      throw error;
    }
  }

  /**
   * Send a project update with optimistic UI update
   */
  public async sendProjectUpdate(
    projectId: string,
    action: 'create' | 'update' | 'delete',
    data?: any
  ): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('RealtimeManager not initialized');
    }

    const updateData = {
      projectId,
      action,
      data,
      version: Date.now(),
      timestamp: Date.now()
    };

    try {
      // Apply optimistic update to local state
      this.stateSync.applyOptimisticUpdate('project', updateData);

      // If online, send immediately
      if (this.connectionManager.getStatus() === 'connected') {
        this.connectionManager.emit('project:update', updateData);
      } else {
        // If offline, queue for later
        await this.syncQueue.enqueue({
          id: `project:${projectId}:${Date.now()}`,
          type: 'project:update',
          payload: updateData,
          timestamp: Date.now(),
          retryCount: 0,
          priority: 'medium',
          status: 'pending'
        });
      }
    } catch (error) {
      // Rollback optimistic update on error
      this.stateSync.rollbackOptimisticUpdate('project', projectId);
      throw error;
    }
  }

  /**
   * Get pending sync queue items
   */
  public getSyncQueue(): SyncQueueItem[] {
    return this.syncQueue.getQueue();
  }

  /**
   * Get connection metrics
   */
  public getConnectionMetrics() {
    return this.connectionManager.getMetrics();
  }

  /**
   * Subscribe to connection status changes
   */
  public onConnectionStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.connectionManager.on('connection:status', callback);
    
    // Return unsubscribe function
    return () => {
      this.connectionManager.off('connection:status', callback);
    };
  }

  /**
   * Subscribe to sync queue updates
   */
  public onSyncQueueUpdate(callback: (queue: SyncQueueItem[]) => void): () => void {
    const handler = (queue: SyncQueueItem[]) => callback(queue);
    this.connectionManager.on('sync:queue:updated', handler);
    
    return () => {
      this.connectionManager.off('sync:queue:updated', handler);
    };
  }

  /**
   * Subscribe to realtime errors
   */
  public onError(callback: (error: Error) => void): () => void {
    this.connectionManager.on('error', callback);
    
    return () => {
      this.connectionManager.off('error', callback);
    };
  }

  /**
   * Setup event handlers for subsystems
   */
  private setupEventHandlers(): void {
    // Handle incoming calendar updates
    this.connectionManager.on('calendar:update', (event: CalendarUpdateEvent) => {
      this.stateSync.handleIncomingUpdate('calendar', event);
    });

    // Handle incoming project updates
    this.connectionManager.on('project:update', (event: ProjectUpdateEvent) => {
      this.stateSync.handleIncomingUpdate('project', event);
    });

    // Handle conflict detection
    this.connectionManager.on('conflict:detected', async (event: ConflictDetectedEvent) => {
      try {
        const resolution = await this.conflictResolver.resolveConflict(event);
        if (resolution) {
          // Apply resolved changes
          this.stateSync.applyConflictResolution(event.payload.resourceType, resolution);
        }
      } catch (error) {
        console.error('RealtimeManager: Error resolving conflict:', error);
      }
    });

    // Handle connection status changes
    this.connectionManager.on('connection:status', async (status: ConnectionStatus) => {
      if (status === 'connected') {
        // Process offline queue when reconnected
        await this.processOfflineQueue();
      }
    });
  }

  /**
   * Process offline queue when connection is restored
   */
  private async processOfflineQueue(): Promise<void> {
    try {
      const queueItems = await this.syncQueue.dequeueAll();
      
      for (const item of queueItems) {
        try {
          this.connectionManager.emit(item.type, item.payload);
          await this.syncQueue.markCompleted(item.id);
        } catch (error) {
          console.error(`RealtimeManager: Failed to process queue item ${item.id}:`, error);
          await this.syncQueue.markFailed(item.id);
        }
      }
    } catch (error) {
      console.error('RealtimeManager: Error processing offline queue:', error);
    }
  }
}