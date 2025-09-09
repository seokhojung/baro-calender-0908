/**
 * Realtime synchronization types for WebSocket and conflict resolution
 */

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';

export interface RealtimeConfig {
  url: string;
  reconnectionDelay: number;
  reconnectionDelayMax: number;
  reconnectionAttempts: number;
  timeout: number;
}

export interface RealtimeEvent {
  type: string;
  payload: any;
  timestamp: number;
  userId?: string;
  version?: number;
}

export interface CalendarUpdateEvent extends RealtimeEvent {
  type: 'calendar:update';
  payload: {
    scheduleId: string;
    projectId: string;
    action: 'create' | 'update' | 'delete';
    data?: any;
    version: number;
  };
}

export interface ProjectUpdateEvent extends RealtimeEvent {
  type: 'project:update';
  payload: {
    projectId: string;
    action: 'create' | 'update' | 'delete';
    data?: any;
    version: number;
  };
}

export interface ConflictDetectedEvent extends RealtimeEvent {
  type: 'conflict:detected';
  payload: {
    resourceId: string;
    resourceType: 'schedule' | 'project';
    conflictType: 'concurrent_edit' | 'version_mismatch';
    localVersion: number;
    serverVersion: number;
    resolution?: ConflictResolution;
  };
}

export interface ConflictResolution {
  strategy: 'last-write-wins' | 'operational-transform' | 'crdt' | 'manual';
  version: number;
  timestamp: number;
  userId: string;
  mergedData?: any;
}

export interface OperationalTransform {
  operation: 'insert' | 'delete' | 'retain' | 'replace';
  position: number;
  content?: any;
  length?: number;
  attributes?: Record<string, any>;
}

export interface SyncQueueItem {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  retryCount: number;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface ConnectionMetrics {
  latency: number;
  packetsLost: number;
  reconnectionCount: number;
  totalUptime: number;
  lastHeartbeat: number;
}

export interface RealtimeManagerEvents {
  'connection:status': (status: ConnectionStatus) => void;
  'connection:metrics': (metrics: ConnectionMetrics) => void;
  'calendar:update': (event: CalendarUpdateEvent) => void;
  'project:update': (event: ProjectUpdateEvent) => void;
  'conflict:detected': (event: ConflictDetectedEvent) => void;
  'sync:queue:updated': (queue: SyncQueueItem[]) => void;
  'error': (error: Error) => void;
}