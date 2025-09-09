/**
 * React hook for realtime synchronization
 * Provides easy interface to the realtime sync system
 */

import { useState, useEffect, useCallback } from 'react';
import { getRealtimeManager } from '@/lib/realtime';
import type { ConnectionStatus, SyncQueueItem } from '@/types/realtime';

export interface UseRealtimeOptions {
  autoConnect?: boolean;
  subscribeToProjects?: string[];
  subscribeToCalendars?: string[];
}

export interface UseRealtimeReturn {
  connectionStatus: ConnectionStatus;
  isConnected: boolean;
  isConnecting: boolean;
  isOffline: boolean;
  syncQueue: SyncQueueItem[];
  connectionMetrics: {
    latency: number;
    packetsLost: number;
    reconnectionCount: number;
    totalUptime: number;
    lastHeartbeat: number;
  };
  sendCalendarUpdate: (scheduleId: string, projectId: string, action: 'create' | 'update' | 'delete', data?: any) => Promise<void>;
  sendProjectUpdate: (projectId: string, action: 'create' | 'update' | 'delete', data?: any) => Promise<void>;
  subscribeToProject: (projectId: string) => void;
  unsubscribeFromProject: (projectId: string) => void;
  subscribeToCalendar: (projectId: string) => void;
  unsubscribeFromCalendar: (projectId: string) => void;
  initialize: () => Promise<void>;
  shutdown: () => Promise<void>;
}

/**
 * Hook for accessing realtime synchronization functionality
 */
export const useRealtime = (options: UseRealtimeOptions = {}): UseRealtimeReturn => {
  const { 
    autoConnect = true, 
    subscribeToProjects = [], 
    subscribeToCalendars = [] 
  } = options;

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [connectionMetrics, setConnectionMetrics] = useState({
    latency: 0,
    packetsLost: 0,
    reconnectionCount: 0,
    totalUptime: 0,
    lastHeartbeat: 0
  });

  // Initialize realtime manager
  const initialize = useCallback(async () => {
    try {
      const manager = getRealtimeManager();
      await manager.initialize();
    } catch (error) {
      console.error('useRealtime: Failed to initialize realtime manager:', error);
      throw error;
    }
  }, []);

  // Shutdown realtime manager
  const shutdown = useCallback(async () => {
    try {
      const manager = getRealtimeManager();
      await manager.shutdown();
    } catch (error) {
      console.error('useRealtime: Failed to shutdown realtime manager:', error);
      throw error;
    }
  }, []);

  // Send calendar update
  const sendCalendarUpdate = useCallback(async (
    scheduleId: string, 
    projectId: string, 
    action: 'create' | 'update' | 'delete', 
    data?: any
  ) => {
    try {
      const manager = getRealtimeManager();
      await manager.sendCalendarUpdate(scheduleId, projectId, action, data);
    } catch (error) {
      console.error('useRealtime: Failed to send calendar update:', error);
      throw error;
    }
  }, []);

  // Send project update
  const sendProjectUpdate = useCallback(async (
    projectId: string, 
    action: 'create' | 'update' | 'delete', 
    data?: any
  ) => {
    try {
      const manager = getRealtimeManager();
      await manager.sendProjectUpdate(projectId, action, data);
    } catch (error) {
      console.error('useRealtime: Failed to send project update:', error);
      throw error;
    }
  }, []);

  // Subscribe to project updates
  const subscribeToProject = useCallback((projectId: string) => {
    try {
      const manager = getRealtimeManager();
      manager.subscribeToProject(projectId);
    } catch (error) {
      console.error('useRealtime: Failed to subscribe to project:', error);
    }
  }, []);

  // Unsubscribe from project updates
  const unsubscribeFromProject = useCallback((projectId: string) => {
    try {
      const manager = getRealtimeManager();
      manager.unsubscribeFromProject(projectId);
    } catch (error) {
      console.error('useRealtime: Failed to unsubscribe from project:', error);
    }
  }, []);

  // Subscribe to calendar updates
  const subscribeToCalendar = useCallback((projectId: string) => {
    try {
      const manager = getRealtimeManager();
      manager.subscribeToCalendar(projectId);
    } catch (error) {
      console.error('useRealtime: Failed to subscribe to calendar:', error);
    }
  }, []);

  // Unsubscribe from calendar updates
  const unsubscribeFromCalendar = useCallback((projectId: string) => {
    try {
      const manager = getRealtimeManager();
      manager.unsubscribeFromCalendar(projectId);
    } catch (error) {
      console.error('useRealtime: Failed to unsubscribe from calendar:', error);
    }
  }, []);

  // Setup event listeners and auto-initialization
  useEffect(() => {
    const manager = getRealtimeManager();
    
    // Subscribe to connection status changes
    const unsubscribeConnectionStatus = manager.onConnectionStatusChange((status) => {
      setConnectionStatus(status);
    });

    // Subscribe to sync queue updates
    const unsubscribeSyncQueue = manager.onSyncQueueUpdate((queue) => {
      setSyncQueue(queue);
    });

    // Subscribe to connection metrics updates
    const updateMetrics = () => {
      const metrics = manager.getConnectionMetrics();
      setConnectionMetrics(metrics);
    };

    // Update metrics periodically
    const metricsInterval = setInterval(updateMetrics, 5000);

    // Auto-connect if enabled
    if (autoConnect) {
      initialize().catch(console.error);
    }

    // Cleanup
    return () => {
      unsubscribeConnectionStatus();
      unsubscribeSyncQueue();
      clearInterval(metricsInterval);
    };
  }, [autoConnect, initialize]);

  // Auto-subscribe to specified projects and calendars
  useEffect(() => {
    if (connectionStatus === 'connected') {
      subscribeToProjects.forEach(projectId => {
        subscribeToProject(projectId);
      });

      subscribeToCalendars.forEach(projectId => {
        subscribeToCalendar(projectId);
      });
    }
  }, [connectionStatus, subscribeToProjects, subscribeToCalendars, subscribeToProject, subscribeToCalendar]);

  // Derived state
  const isConnected = connectionStatus === 'connected';
  const isConnecting = connectionStatus === 'connecting' || connectionStatus === 'reconnecting';
  const isOffline = connectionStatus === 'disconnected' || connectionStatus === 'error';

  return {
    connectionStatus,
    isConnected,
    isConnecting,
    isOffline,
    syncQueue,
    connectionMetrics,
    sendCalendarUpdate,
    sendProjectUpdate,
    subscribeToProject,
    unsubscribeFromProject,
    subscribeToCalendar,
    unsubscribeFromCalendar,
    initialize,
    shutdown
  };
};

/**
 * Hook for monitoring connection status only
 */
export const useRealtimeConnection = () => {
  const { connectionStatus, isConnected, isConnecting, isOffline, connectionMetrics } = useRealtime({
    autoConnect: false
  });

  return {
    connectionStatus,
    isConnected,
    isConnecting,
    isOffline,
    connectionMetrics
  };
};

/**
 * Hook for calendar-specific realtime operations
 */
export const useRealtimeCalendar = (projectId?: string) => {
  const realtime = useRealtime({
    autoConnect: true,
    subscribeToCalendars: projectId ? [projectId] : []
  });

  const sendScheduleUpdate = useCallback((
    scheduleId: string, 
    action: 'create' | 'update' | 'delete', 
    data?: any
  ) => {
    if (!projectId) {
      throw new Error('Project ID is required for calendar updates');
    }
    return realtime.sendCalendarUpdate(scheduleId, projectId, action, data);
  }, [realtime, projectId]);

  return {
    ...realtime,
    sendScheduleUpdate
  };
};

/**
 * Hook for project-specific realtime operations
 */
export const useRealtimeProject = (projectId?: string) => {
  const realtime = useRealtime({
    autoConnect: true,
    subscribeToProjects: projectId ? [projectId] : []
  });

  const sendUpdate = useCallback((
    action: 'create' | 'update' | 'delete', 
    data?: any
  ) => {
    if (!projectId) {
      throw new Error('Project ID is required for project updates');
    }
    return realtime.sendProjectUpdate(projectId, action, data);
  }, [realtime, projectId]);

  return {
    ...realtime,
    sendUpdate
  };
};