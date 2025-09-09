/**
 * WebSocket Connection Manager for realtime synchronization
 * Handles connection lifecycle, reconnection, and heartbeat monitoring
 */

import { io, Socket } from 'socket.io-client';
import type { 
  ConnectionStatus, 
  RealtimeConfig, 
  RealtimeManagerEvents,
  ConnectionMetrics 
} from '@/types/realtime';

export class ConnectionManager {
  private socket: Socket | null = null;
  private status: ConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private connectionStartTime = 0;
  private metrics: ConnectionMetrics = {
    latency: 0,
    packetsLost: 0,
    reconnectionCount: 0,
    totalUptime: 0,
    lastHeartbeat: 0
  };

  private eventHandlers = new Map<keyof RealtimeManagerEvents, Function[]>();

  private config: RealtimeConfig = {
    url: process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8000',
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
    timeout: 30000
  };

  constructor(config?: Partial<RealtimeConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Establish WebSocket connection
   */
  public connect(): void {
    if (this.status === 'connected' || this.status === 'connecting') {
      console.warn('ConnectionManager: Already connected or connecting');
      return;
    }

    this.setStatus('connecting');
    this.connectionStartTime = Date.now();

    this.socket = io(this.config.url, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: this.config.reconnectionDelay,
      reconnectionDelayMax: this.config.reconnectionDelayMax,
      reconnectionAttempts: this.config.reconnectionAttempts,
      timeout: this.config.timeout,
      autoConnect: true
    });

    this.setupEventHandlers();
    this.setupHeartbeat();
  }

  /**
   * Disconnect WebSocket connection
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    this.setStatus('disconnected');
    this.updateMetrics();
  }

  /**
   * Send message through WebSocket
   */
  public emit<T = any>(event: string, data: T): void {
    if (!this.socket || this.status !== 'connected') {
      console.warn('ConnectionManager: Cannot emit - not connected');
      return;
    }

    const startTime = performance.now();
    
    this.socket.emit(event, data, () => {
      // Calculate latency on acknowledgment
      const latency = performance.now() - startTime;
      this.metrics.latency = latency;
      this.emitToListeners('connection:metrics', this.metrics);
    });
  }

  /**
   * Subscribe to realtime events
   */
  public on<K extends keyof RealtimeManagerEvents>(
    event: K, 
    handler: RealtimeManagerEvents[K]
  ): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  /**
   * Unsubscribe from realtime events
   */
  public off<K extends keyof RealtimeManagerEvents>(
    event: K, 
    handler: RealtimeManagerEvents[K]
  ): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index >= 0) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Get current connection status
   */
  public getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Get connection metrics
   */
  public getMetrics(): ConnectionMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Join a room for selective subscriptions
   */
  public joinRoom(roomId: string): void {
    if (this.socket && this.status === 'connected') {
      this.socket.emit('join:room', { roomId });
    }
  }

  /**
   * Leave a room
   */
  public leaveRoom(roomId: string): void {
    if (this.socket && this.status === 'connected') {
      this.socket.emit('leave:room', { roomId });
    }
  }

  /**
   * Setup Socket.io event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('ConnectionManager: Connected to WebSocket server');
      this.setStatus('connected');
      this.reconnectAttempts = 0;
      this.updateMetrics();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('ConnectionManager: Disconnected from WebSocket server:', reason);
      this.setStatus('disconnected');
      this.updateMetrics();
    });

    this.socket.on('connect_error', (error) => {
      console.error('ConnectionManager: Connection error:', error);
      this.setStatus('error');
      this.emitToListeners('error', error);
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`ConnectionManager: Reconnection attempt ${attemptNumber}`);
      this.setStatus('reconnecting');
      this.reconnectAttempts = attemptNumber;
      this.metrics.reconnectionCount = attemptNumber;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`ConnectionManager: Reconnected after ${attemptNumber} attempts`);
      this.setStatus('connected');
      this.updateMetrics();
    });

    this.socket.on('reconnect_failed', () => {
      console.error('ConnectionManager: Reconnection failed');
      this.setStatus('error');
      this.emitToListeners('error', new Error('Failed to reconnect to WebSocket server'));
    });

    // Forward application-level events
    this.socket.on('calendar:update', (data) => {
      this.emitToListeners('calendar:update', data);
    });

    this.socket.on('project:update', (data) => {
      this.emitToListeners('project:update', data);
    });

    this.socket.on('conflict:detected', (data) => {
      this.emitToListeners('conflict:detected', data);
    });

    this.socket.on('pong', (data) => {
      const now = Date.now();
      if (data.timestamp) {
        this.metrics.latency = now - data.timestamp;
      }
      this.metrics.lastHeartbeat = now;
      this.emitToListeners('connection:metrics', this.metrics);
    });
  }

  /**
   * Setup heartbeat mechanism
   */
  private setupHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.status === 'connected') {
        const timestamp = Date.now();
        this.socket.emit('ping', { timestamp });
      }
    }, 10000); // Send heartbeat every 10 seconds
  }

  /**
   * Set connection status and notify listeners
   */
  private setStatus(status: ConnectionStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.emitToListeners('connection:status', status);
    }
  }

  /**
   * Update connection metrics
   */
  private updateMetrics(): void {
    if (this.connectionStartTime > 0) {
      const now = Date.now();
      this.metrics.totalUptime = now - this.connectionStartTime;
      
      if (this.status === 'disconnected') {
        this.connectionStartTime = 0;
      }
    }
  }

  /**
   * Emit event to all registered handlers
   */
  private emitToListeners<K extends keyof RealtimeManagerEvents>(
    event: K, 
    data: Parameters<RealtimeManagerEvents[K]>[0]
  ): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          (handler as Function)(data);
        } catch (error) {
          console.error(`ConnectionManager: Error in ${event} handler:`, error);
        }
      });
    }
  }
}