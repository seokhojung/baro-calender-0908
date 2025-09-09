/**
 * Realtime Provider Component
 * Initializes and provides realtime sync functionality to the app
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeRealtime, shutdownRealtime, getRealtimeManager } from '@/lib/realtime';
import { useToast } from '@/hooks/use-toast';
import type { ConnectionStatus } from '@/types/realtime';

interface RealtimeContextType {
  isInitialized: boolean;
  connectionStatus: ConnectionStatus;
  isConnected: boolean;
  error: string | null;
}

const RealtimeContext = createContext<RealtimeContextType>({
  isInitialized: false,
  connectionStatus: 'disconnected',
  isConnected: false,
  error: null
});

interface RealtimeProviderProps {
  children: React.ReactNode;
  enableToasts?: boolean;
}

export const RealtimeProvider: React.FC<RealtimeProviderProps> = ({ 
  children, 
  enableToasts = true 
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    let unsubscribeConnectionStatus: (() => void) | null = null;
    let unsubscribeError: (() => void) | null = null;

    const initialize = async () => {
      try {
        console.log('RealtimeProvider: Initializing realtime system...');
        
        // Initialize the realtime manager
        await initializeRealtime();
        
        if (!mounted) return;

        const manager = getRealtimeManager();

        // Subscribe to connection status changes
        unsubscribeConnectionStatus = manager.onConnectionStatusChange((status) => {
          if (!mounted) return;
          
          setConnectionStatus(status);
          
          if (enableToasts) {
            switch (status) {
              case 'connected':
                toast({
                  title: 'Connected',
                  description: 'Realtime sync is now active',
                  variant: 'default'
                });
                break;
              case 'disconnected':
                toast({
                  title: 'Disconnected',
                  description: 'Realtime sync is offline',
                  variant: 'destructive'
                });
                break;
              case 'reconnecting':
                toast({
                  title: 'Reconnecting',
                  description: 'Attempting to restore realtime sync...',
                  variant: 'default'
                });
                break;
              case 'error':
                toast({
                  title: 'Connection Error',
                  description: 'Failed to connect to realtime sync',
                  variant: 'destructive'
                });
                break;
            }
          }
        });

        // Subscribe to error events
        unsubscribeError = manager.onError((error) => {
          if (!mounted) return;
          
          console.error('RealtimeProvider: Realtime error:', error);
          setError(error.message);
          
          if (enableToasts) {
            toast({
              title: 'Realtime Error',
              description: error.message,
              variant: 'destructive'
            });
          }
        });

        setIsInitialized(true);
        setError(null);
        
        console.log('RealtimeProvider: Successfully initialized');

      } catch (error) {
        if (!mounted) return;
        
        console.error('RealtimeProvider: Failed to initialize:', error);
        setError(error instanceof Error ? error.message : 'Failed to initialize realtime sync');
        
        if (enableToasts) {
          toast({
            title: 'Initialization Error',
            description: 'Failed to start realtime sync',
            variant: 'destructive'
          });
        }
      }
    };

    // Start initialization
    initialize();

    // Cleanup function
    return () => {
      mounted = false;
      
      // Unsubscribe from events
      if (unsubscribeConnectionStatus) {
        unsubscribeConnectionStatus();
      }
      if (unsubscribeError) {
        unsubscribeError();
      }
      
      // Shutdown realtime system
      shutdownRealtime().catch((error) => {
        console.error('RealtimeProvider: Error during shutdown:', error);
      });
    };
  }, [enableToasts, toast]);

  const contextValue: RealtimeContextType = {
    isInitialized,
    connectionStatus,
    isConnected: connectionStatus === 'connected',
    error
  };

  return (
    <RealtimeContext.Provider value={contextValue}>
      {children}
    </RealtimeContext.Provider>
  );
};

/**
 * Hook to access realtime context
 */
export const useRealtimeContext = (): RealtimeContextType => {
  const context = useContext(RealtimeContext);
  
  if (!context) {
    throw new Error('useRealtimeContext must be used within a RealtimeProvider');
  }
  
  return context;
};

/**
 * Connection Status Indicator Component
 */
interface ConnectionStatusProps {
  className?: string;
  showText?: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  className = '', 
  showText = true 
}) => {
  const { connectionStatus, isConnected } = useRealtimeContext();

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
      case 'reconnecting':
        return 'bg-yellow-500';
      case 'disconnected':
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'reconnecting':
        return 'Reconnecting...';
      case 'disconnected':
        return 'Offline';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div 
        className={`w-2 h-2 rounded-full ${getStatusColor()} ${
          connectionStatus === 'connecting' || connectionStatus === 'reconnecting' 
            ? 'animate-pulse' 
            : ''
        }`}
        title={`Realtime sync status: ${getStatusText()}`}
      />
      {showText && (
        <span className="text-xs text-muted-foreground">
          {getStatusText()}
        </span>
      )}
    </div>
  );
};

export default RealtimeProvider;