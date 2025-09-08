'use client';

import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useProjectRealtimeContext } from '@/components/providers/ProjectRealtimeProvider';

interface ConnectionStatusProps {
  className?: string;
  showReconnectButton?: boolean;
  variant?: 'badge' | 'full';
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  className,
  showReconnectButton = true,
  variant = 'badge'
}) => {
  const { isConnected, isConnecting, error, lastUpdate, reconnect } = useProjectRealtimeContext();
  
  const getStatusInfo = () => {
    if (isConnecting) {
      return {
        icon: RefreshCw,
        text: '연결 중...',
        variant: 'secondary' as const,
        className: 'text-yellow-600',
        spinning: true
      };
    }
    
    if (isConnected) {
      return {
        icon: Wifi,
        text: '실시간 동기화',
        variant: 'secondary' as const,
        className: 'text-green-600',
        spinning: false
      };
    }
    
    return {
      icon: WifiOff,
      text: error ? '연결 실패' : '오프라인',
      variant: 'destructive' as const,
      className: 'text-red-600',
      spinning: false
    };
  };
  
  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;
  
  if (variant === 'badge') {
    return (
      <Badge 
        variant={statusInfo.variant}
        className={cn("gap-2 cursor-default", className)}
        title={error || statusInfo.text}
      >
        <Icon 
          className={cn(
            "w-3 h-3",
            statusInfo.spinning && "animate-spin"
          )} 
        />
        {statusInfo.text}
      </Badge>
    );
  }
  
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex items-center gap-2">
        <Icon 
          className={cn(
            "w-4 h-4",
            statusInfo.className,
            statusInfo.spinning && "animate-spin"
          )} 
        />
        <span className={cn("text-sm font-medium", statusInfo.className)}>
          {statusInfo.text}
        </span>
      </div>
      
      {!isConnected && !isConnecting && showReconnectButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={reconnect}
          className="gap-2"
        >
          <RefreshCw className="w-3 h-3" />
          다시 연결
        </Button>
      )}
      
      {lastUpdate && isConnected && (
        <span className="text-xs text-muted-foreground">
          마지막 업데이트: {lastUpdate.toLocaleTimeString('ko-KR')}
        </span>
      )}
      
      {error && (
        <span className="text-xs text-red-600" title={error}>
          {error.length > 30 ? `${error.substring(0, 30)}...` : error}
        </span>
      )}
    </div>
  );
};