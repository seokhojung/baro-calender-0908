'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useProjectRealtime } from '@/hooks/useProjectRealtime';

interface ProjectRealtimeContextValue {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastUpdate: Date | null;
  reconnect: () => void;
}

const ProjectRealtimeContext = createContext<ProjectRealtimeContextValue | null>(null);

export const useProjectRealtimeContext = () => {
  const context = useContext(ProjectRealtimeContext);
  if (!context) {
    throw new Error('useProjectRealtimeContext must be used within ProjectRealtimeProvider');
  }
  return context;
};

interface ProjectRealtimeProviderProps {
  children: React.ReactNode;
  enabled?: boolean;
  showNotifications?: boolean;
}

export const ProjectRealtimeProvider: React.FC<ProjectRealtimeProviderProps> = ({
  children,
  enabled = true,
  showNotifications = true
}) => {
  const realtime = useProjectRealtime({
    enabled,
    showNotifications,
    autoReconnect: true,
    maxReconnectAttempts: 5
  });
  
  const contextValue: ProjectRealtimeContextValue = {
    isConnected: realtime.isConnected,
    isConnecting: realtime.isConnecting,
    error: realtime.error,
    lastUpdate: realtime.lastUpdate,
    reconnect: realtime.reconnect
  };
  
  return (
    <ProjectRealtimeContext.Provider value={contextValue}>
      {children}
    </ProjectRealtimeContext.Provider>
  );
};