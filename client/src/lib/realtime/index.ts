/**
 * Realtime Synchronization System
 * Main exports for the unified realtime sync implementation
 */

export { RealtimeManager } from './RealtimeManager';
export { ConnectionManager } from './ConnectionManager';
export { SyncQueue } from './SyncQueue';
export { ConflictResolver } from './ConflictResolver';
export { StateSync } from './StateSync';

// Re-export types
export type {
  ConnectionStatus,
  RealtimeConfig,
  RealtimeEvent,
  CalendarUpdateEvent,
  ProjectUpdateEvent,
  ConflictDetectedEvent,
  ConflictResolution,
  OperationalTransform,
  SyncQueueItem,
  ConnectionMetrics,
  RealtimeManagerEvents
} from '@/types/realtime';

// Singleton instance getter
let realtimeManager: ReturnType<typeof RealtimeManager.getInstance> | null = null;

/**
 * Get the global realtime manager instance
 */
export const getRealtimeManager = () => {
  if (!realtimeManager) {
    realtimeManager = RealtimeManager.getInstance({
      url: process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8000',
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      timeout: 30000
    });
  }
  return realtimeManager;
};

/**
 * Initialize the realtime sync system
 * Call this once in your app initialization
 */
export const initializeRealtime = async () => {
  const manager = getRealtimeManager();
  await manager.initialize();
  return manager;
};

/**
 * Cleanup the realtime sync system
 * Call this during app shutdown
 */
export const shutdownRealtime = async () => {
  if (realtimeManager) {
    await realtimeManager.shutdown();
    realtimeManager = null;
  }
};