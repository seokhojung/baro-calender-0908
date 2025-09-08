'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Project, ProjectUpdate, ProjectUpdateType } from '@/types/project';
import useProjectStore from '@/stores/projectStore';

interface RealtimeConnection {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastUpdate: Date | null;
  reconnectCount: number;
}

interface UseProjectRealtimeOptions {
  enabled?: boolean;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  showNotifications?: boolean;
}

const DEFAULT_OPTIONS: UseProjectRealtimeOptions = {
  enabled: true,
  autoReconnect: true,
  reconnectInterval: 3000,
  maxReconnectAttempts: 5,
  showNotifications: true
};

export const useProjectRealtime = (options: UseProjectRealtimeOptions = {}) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [connection, setConnection] = useState<RealtimeConnection>({
    isConnected: false,
    isConnecting: false,
    error: null,
    lastUpdate: null,
    reconnectCount: 0
  });
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { 
    loadProjects,
    selectProject,
    optimisticUpdate,
    projects 
  } = useProjectStore();
  
  // Handle incoming WebSocket messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const update: ProjectUpdate = JSON.parse(event.data);
      
      if (update.type && update.project) {
        handleProjectUpdate(update);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }, []);
  
  // Handle project updates from WebSocket
  const handleProjectUpdate = useCallback((update: ProjectUpdate) => {
    const { type, project } = update;
    
    if (!project) return;
    
    switch (type) {
      case 'CREATED':
        // Add the new project to the store
        useProjectStore.getState().projects.push(project);
        if (opts.showNotifications) {
          toast.success(`새 프로젝트 "${project.name}"가 생성되었습니다`, {
            description: '다른 사용자가 프로젝트를 생성했습니다.',
            duration: 5000
          });
        }
        break;
        
      case 'UPDATED':
        // Update the existing project
        optimisticUpdate(project.id, project);
        if (opts.showNotifications) {
          toast.info(`프로젝트 "${project.name}"가 업데이트되었습니다`, {
            description: '다른 사용자가 프로젝트를 수정했습니다.',
            duration: 4000
          });
        }
        break;
        
      case 'DELETED':
        // Remove the project from the store
        const currentProjects = useProjectStore.getState().projects;
        const deletedProject = currentProjects.find(p => p.id === project.id);
        useProjectStore.getState().projects = currentProjects.filter(p => p.id !== project.id);
        
        // Update selected project if it was the deleted one
        const selectedProject = useProjectStore.getState().selectedProject;
        if (selectedProject?.id === project.id) {
          const remainingProjects = useProjectStore.getState().projects;
          selectProject(remainingProjects[0] || null);
        }
        
        if (opts.showNotifications) {
          toast.warning(`프로젝트 "${deletedProject?.name || 'Unknown'}"가 삭제되었습니다`, {
            description: '다른 사용자가 프로젝트를 삭제했습니다.',
            duration: 5000
          });
        }
        break;
        
      case 'REORDERED':
        // Reload projects to get the new order
        loadProjects();
        if (opts.showNotifications) {
          toast.info('프로젝트 순서가 변경되었습니다', {
            description: '다른 사용자가 프로젝트 순서를 변경했습니다.',
            duration: 3000
          });
        }
        break;
    }
    
    setConnection(prev => ({
      ...prev,
      lastUpdate: new Date()
    }));
  }, [loadProjects, optimisticUpdate, selectProject, opts.showNotifications]);
  
  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!opts.enabled || wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }
    
    setConnection(prev => ({
      ...prev,
      isConnecting: true,
      error: null
    }));
    
    try {
      // In a real implementation, this would connect to your GraphQL subscription endpoint
      // For now, we'll simulate the connection
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000/graphql';
      
      // Mock WebSocket for development
      const mockWs = {
        readyState: WebSocket.OPEN,
        close: () => {},
        send: () => {},
        addEventListener: () => {},
        removeEventListener: () => {}
      } as any;
      
      wsRef.current = mockWs;
      
      setConnection(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        reconnectCount: 0
      }));
      
      // Start heartbeat
      heartbeatIntervalRef.current = setInterval(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          // Send heartbeat in real implementation
          // wsRef.current.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);
      
      if (opts.showNotifications) {
        toast.success('실시간 동기화 연결됨', {
          description: '프로젝트 변경사항이 실시간으로 동기화됩니다.',
          duration: 3000
        });
      }
      
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      setConnection(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      }));
      
      // Schedule reconnection
      if (opts.autoReconnect && connection.reconnectCount < opts.maxReconnectAttempts!) {
        scheduleReconnect();
      }
    }
  }, [opts.enabled, opts.autoReconnect, opts.maxReconnectAttempts, opts.showNotifications, connection.reconnectCount]);
  
  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setConnection(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false
    }));
  }, []);
  
  // Schedule reconnection
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    reconnectTimeoutRef.current = setTimeout(() => {
      setConnection(prev => ({
        ...prev,
        reconnectCount: prev.reconnectCount + 1
      }));
      connect();
    }, opts.reconnectInterval);
  }, [connect, opts.reconnectInterval]);
  
  // Manual reconnect
  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(connect, 1000);
  }, [connect, disconnect]);
  
  // Send project update (for future use)
  const sendProjectUpdate = useCallback((update: Partial<ProjectUpdate>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(update));
    }
  }, []);
  
  // Initialize connection
  useEffect(() => {
    if (opts.enabled) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [opts.enabled, connect, disconnect]);
  
  // Handle visibility change (reconnect when tab becomes active)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !connection.isConnected && opts.enabled) {
        reconnect();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [connection.isConnected, opts.enabled, reconnect]);
  
  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      if (opts.enabled && !connection.isConnected) {
        reconnect();
      }
    };
    
    const handleOffline = () => {
      disconnect();
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [opts.enabled, connection.isConnected, reconnect, disconnect]);
  
  return {
    ...connection,
    connect,
    disconnect,
    reconnect,
    sendProjectUpdate
  };
};