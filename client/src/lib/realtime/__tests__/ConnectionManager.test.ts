/**
 * ConnectionManager tests
 */

import { ConnectionManager } from '../ConnectionManager';
import { io } from 'socket.io-client';

// Mock socket.io-client
jest.mock('socket.io-client');

describe('ConnectionManager', () => {
  let connectionManager: ConnectionManager;
  let mockSocket: any;

  beforeEach(() => {
    mockSocket = {
      on: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
      connected: false,
    };

    (io as jest.Mock).mockReturnValue(mockSocket);
    
    connectionManager = new ConnectionManager({
      url: 'ws://localhost:8000',
      reconnectionDelay: 100,
      reconnectionDelayMax: 500,
      reconnectionAttempts: 3,
      timeout: 1000
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    connectionManager.disconnect();
  });

  describe('Connection Management', () => {
    it('should create socket connection with correct config', () => {
      connectionManager.connect();

      expect(io).toHaveBeenCalledWith('ws://localhost:8000', {
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 100,
        reconnectionDelayMax: 500,
        reconnectionAttempts: 3,
        timeout: 1000,
        autoConnect: true
      });
    });

    it('should not connect if already connecting', () => {
      connectionManager.connect();
      connectionManager.connect();

      expect(io).toHaveBeenCalledTimes(1);
    });

    it('should disconnect socket', () => {
      connectionManager.connect();
      connectionManager.disconnect();

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(connectionManager.getStatus()).toBe('disconnected');
    });

    it('should setup event handlers on connection', () => {
      connectionManager.connect();

      const expectedEvents = [
        'connect',
        'disconnect', 
        'connect_error',
        'reconnect_attempt',
        'reconnect',
        'reconnect_failed',
        'calendar:update',
        'project:update',
        'conflict:detected',
        'pong'
      ];

      expectedEvents.forEach(event => {
        expect(mockSocket.on).toHaveBeenCalledWith(event, expect.any(Function));
      });
    });
  });

  describe('Event Handling', () => {
    it('should update status on connect', () => {
      const statusHandler = jest.fn();
      connectionManager.on('connection:status', statusHandler);
      connectionManager.connect();

      // Simulate socket connect event
      const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
      connectHandler();

      expect(statusHandler).toHaveBeenCalledWith('connected');
    });

    it('should update status on disconnect', () => {
      const statusHandler = jest.fn();
      connectionManager.on('connection:status', statusHandler);
      connectionManager.connect();

      // Simulate socket disconnect event
      const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')[1];
      disconnectHandler('transport close');

      expect(statusHandler).toHaveBeenCalledWith('disconnected');
    });

    it('should handle connection errors', () => {
      const errorHandler = jest.fn();
      connectionManager.on('error', errorHandler);
      connectionManager.connect();

      const error = new Error('Connection failed');
      const errorEventHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')[1];
      errorEventHandler(error);

      expect(errorHandler).toHaveBeenCalledWith(error);
    });

    it('should forward application events', () => {
      const calendarHandler = jest.fn();
      const projectHandler = jest.fn();
      const conflictHandler = jest.fn();

      connectionManager.on('calendar:update', calendarHandler);
      connectionManager.on('project:update', projectHandler);
      connectionManager.on('conflict:detected', conflictHandler);

      connectionManager.connect();

      // Simulate receiving events
      const calendarEventHandler = mockSocket.on.mock.calls.find(call => call[0] === 'calendar:update')[1];
      const projectEventHandler = mockSocket.on.mock.calls.find(call => call[0] === 'project:update')[1];
      const conflictEventHandler = mockSocket.on.mock.calls.find(call => call[0] === 'conflict:detected')[1];

      const calendarData = { type: 'calendar:update', payload: { scheduleId: '1' } };
      const projectData = { type: 'project:update', payload: { projectId: '1' } };
      const conflictData = { type: 'conflict:detected', payload: { resourceId: '1' } };

      calendarEventHandler(calendarData);
      projectEventHandler(projectData);
      conflictEventHandler(conflictData);

      expect(calendarHandler).toHaveBeenCalledWith(calendarData);
      expect(projectHandler).toHaveBeenCalledWith(projectData);
      expect(conflictHandler).toHaveBeenCalledWith(conflictData);
    });
  });

  describe('Message Emission', () => {
    beforeEach(() => {
      connectionManager.connect();
      // Simulate connected status
      const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
      connectHandler();
    });

    it('should emit messages when connected', () => {
      const testData = { message: 'test' };
      connectionManager.emit('test:event', testData);

      expect(mockSocket.emit).toHaveBeenCalledWith('test:event', testData, expect.any(Function));
    });

    it('should not emit messages when disconnected', () => {
      // Simulate disconnect
      const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')[1];
      disconnectHandler('transport close');

      const testData = { message: 'test' };
      connectionManager.emit('test:event', testData);

      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });

  describe('Room Management', () => {
    beforeEach(() => {
      connectionManager.connect();
      // Simulate connected status
      const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
      connectHandler();
    });

    it('should join room when connected', () => {
      connectionManager.joinRoom('project:123');

      expect(mockSocket.emit).toHaveBeenCalledWith('join:room', { roomId: 'project:123' });
    });

    it('should leave room when connected', () => {
      connectionManager.leaveRoom('project:123');

      expect(mockSocket.emit).toHaveBeenCalledWith('leave:room', { roomId: 'project:123' });
    });

    it('should not join room when disconnected', () => {
      // Disconnect first
      connectionManager.disconnect();
      connectionManager.joinRoom('project:123');

      // Should not have called emit for join (only disconnect)
      expect(mockSocket.emit).not.toHaveBeenCalledWith('join:room', expect.any(Object));
    });
  });

  describe('Heartbeat', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should send heartbeat at regular intervals', () => {
      connectionManager.connect();
      
      // Simulate connected status
      const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
      connectHandler();

      // Fast-forward 10 seconds
      jest.advanceTimersByTime(10000);

      expect(mockSocket.emit).toHaveBeenCalledWith('ping', { timestamp: expect.any(Number) });
    });

    it('should not send heartbeat when disconnected', () => {
      connectionManager.connect();
      connectionManager.disconnect();

      jest.advanceTimersByTime(10000);

      expect(mockSocket.emit).not.toHaveBeenCalledWith('ping', expect.any(Object));
    });

    it('should update metrics on pong', () => {
      const metricsHandler = jest.fn();
      connectionManager.on('connection:metrics', metricsHandler);
      connectionManager.connect();

      const pongHandler = mockSocket.on.mock.calls.find(call => call[0] === 'pong')[1];
      const timestamp = Date.now() - 100; // 100ms ago
      pongHandler({ timestamp });

      expect(metricsHandler).toHaveBeenCalledWith(expect.objectContaining({
        latency: expect.any(Number),
        lastHeartbeat: expect.any(Number)
      }));
    });
  });

  describe('Metrics', () => {
    it('should return connection metrics', () => {
      const metrics = connectionManager.getMetrics();

      expect(metrics).toEqual({
        latency: 0,
        packetsLost: 0,
        reconnectionCount: 0,
        totalUptime: 0,
        lastHeartbeat: 0
      });
    });

    it('should update uptime when connected', () => {
      jest.useFakeTimers();
      
      connectionManager.connect();
      
      // Simulate connected status
      const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
      connectHandler();

      jest.advanceTimersByTime(5000);

      const metrics = connectionManager.getMetrics();
      expect(metrics.totalUptime).toBeGreaterThan(0);

      jest.useRealTimers();
    });
  });
});