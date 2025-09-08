"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { Clock, MapPin, Users, MoreHorizontal, GripVertical, Edit2, Trash2 } from 'lucide-react';
import { Event } from '@/types/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TouchOptimizedButton } from '@/components/ui/responsive-layout';
import { useAccessibility } from '@/hooks/useAccessibility';
import { cn } from '@/lib/utils';
import { format, addMinutes } from 'date-fns';

interface EventCardProps {
  event: Event;
  projectColor?: string;
  projectName?: string;
  onEdit?: (event: Event) => void;
  onDelete?: (event: Event) => void;
  onSelect?: (event: Event) => void;
  onResize?: (eventId: string, newStartDate: Date, newEndDate: Date) => void;
  isSelected?: boolean;
  isCompact?: boolean;
  showTime?: boolean;
  className?: string;
  isResizable?: boolean;
  minHeight?: number;
  isMobile?: boolean;
  touchOptimized?: boolean;
  enableAccessibility?: boolean;
}

export interface DragItem {
  id: string;
  type: string;
  event: Event;
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  projectColor,
  projectName,
  onEdit,
  onDelete,
  onSelect,
  onResize,
  isSelected = false,
  isCompact = false,
  showTime = true,
  className,
  isResizable = false,
  minHeight = 30,
  isMobile = false,
  touchOptimized = false,
  enableAccessibility = true
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<'top' | 'bottom' | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { generateAriaLabel } = useAccessibility({ enableKeyboardNavigation: enableAccessibility });

  // Touch and long press handling for mobile
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  const [{ isDragging }, drag] = useDrag({
    type: 'event',
    item: (): DragItem => ({
      id: event.id,
      type: 'event',
      event
    }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: !isResizing, // Don't allow dragging while resizing
  });

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMobile && touchOptimized) {
      // On mobile, single tap selects, double tap edits
      onSelect?.(event);
    } else {
      onSelect?.(event);
    }
  }, [event, onSelect, isMobile, touchOptimized]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile || !touchOptimized) return;
    
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    
    // Start long press timer
    longPressTimer.current = setTimeout(() => {
      setShowActions(true);
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500);
  }, [isMobile, touchOptimized]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isMobile || !touchOptimized) return;
    
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    
    const touch = e.changedTouches[0];
    const startPos = touchStartPos.current;
    
    if (startPos) {
      const deltaX = Math.abs(touch.clientX - startPos.x);
      const deltaY = Math.abs(touch.clientY - startPos.y);
      
      // If it's a tap (not a drag)
      if (deltaX < 10 && deltaY < 10) {
        handleClick(e as any);
      }
    }
    
    touchStartPos.current = null;
  }, [isMobile, touchOptimized, handleClick]);

  const handleTouchMove = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  }, []);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(event);
    setShowActions(false);
  }, [event, onEdit]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(event);
    setShowActions(false);
  }, [event, onDelete]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!enableAccessibility) return;
    
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        onSelect?.(event);
        break;
      case 'e':
      case 'E':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          onEdit?.(event);
        }
        break;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        onDelete?.(event);
        break;
      case 'Escape':
        setShowActions(false);
        break;
    }
  }, [event, onSelect, onEdit, onDelete, enableAccessibility]);

  // Resize handle mouse down
  const handleResizeStart = (e: React.MouseEvent, direction: 'top' | 'bottom') => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!onResize) return;
    
    setIsResizing(true);
    setResizeDirection(direction);
    
    const startY = e.clientY;
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    const pixelsPerMinute = 1; // Should match the view's pixels per minute

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - startY;
      const deltaMinutes = Math.round(deltaY / pixelsPerMinute);
      
      let newStartDate = startDate;
      let newEndDate = endDate;
      
      if (direction === 'top') {
        // Resize from top - change start time
        newStartDate = addMinutes(startDate, deltaMinutes);
        
        // Ensure minimum duration
        if (newEndDate.getTime() - newStartDate.getTime() < minHeight * 60000) {
          newStartDate = addMinutes(newEndDate, -(minHeight));
        }
      } else {
        // Resize from bottom - change end time
        newEndDate = addMinutes(endDate, deltaMinutes);
        
        // Ensure minimum duration
        if (newEndDate.getTime() - newStartDate.getTime() < minHeight * 60000) {
          newEndDate = addMinutes(newStartDate, minHeight);
        }
      }
      
      // Update the event immediately for visual feedback
      onResize(event.id, newStartDate, newEndDate);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const colorStyle = projectColor || event.color;
  const startTime = format(new Date(event.startDate), 'HH:mm');
  const endTime = format(new Date(event.endDate), 'HH:mm');
  const timeRange = `${startTime} - ${endTime}`;

  // Generate ARIA label for accessibility
  const eventAriaLabel = enableAccessibility ? generateAriaLabel('event', {
    event,
    startTime: showTime ? startTime : undefined,
    endTime: showTime ? endTime : undefined
  }) : undefined;

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  if (isCompact) {
    return (
      <div
        ref={(node) => {
          drag(node);
          cardRef.current = node;
        }}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onKeyDown={handleKeyDown}
        className={cn(
          "relative flex items-center gap-1 sm:gap-2 rounded text-xs cursor-pointer transition-all duration-200",
          "hover:shadow-sm focus-visible-only",
          isDragging && "opacity-50",
          isSelected && "ring-2 ring-blue-500 ring-offset-1",
          isResizing && "select-none",
          isMobile ? "p-1 min-h-touch" : "p-1 sm:p-2",
          touchOptimized && "touch-manipulation tap-highlight-transparent",
          className
        )}
        style={{ 
          backgroundColor: `${colorStyle}20`,
          borderLeft: `3px solid ${colorStyle}`,
          opacity: isDragging ? 0.5 : 1
        }}
        role="button"
        tabIndex={isSelected ? 0 : -1}
        aria-label={eventAriaLabel}
        aria-selected={isSelected}
        aria-pressed={showActions}
      >
        {/* Top resize handle for time-based events */}
        {isResizable && isHovered && !event.allDay && (
          <div
            className="absolute -top-1 left-0 right-0 h-2 cursor-ns-resize flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
            onMouseDown={(e) => handleResizeStart(e, 'top')}
          >
            <div className="w-6 h-1 bg-blue-500 rounded-full" />
          </div>
        )}

        <div
          className={cn(
            "rounded-full flex-shrink-0",
            isMobile ? "w-1.5 h-1.5" : "w-2 h-2"
          )}
          style={{ backgroundColor: colorStyle }}
          aria-hidden="true"
        />
        <div className="flex-1 flex flex-col min-w-0">
          <span className={cn(
            "truncate font-medium",
            isMobile ? "text-xs" : "text-xs sm:text-sm"
          )}>
            {event.title}
          </span>
          {projectName && !isCompact && (
            <span className="text-[10px] text-muted-foreground truncate">{projectName}</span>
          )}
        </div>
        
        {/* Actions for mobile */}
        {isMobile && touchOptimized && showActions && (
          <div className="flex items-center gap-1 ml-2">
            <TouchOptimizedButton
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className="h-8 w-8 p-0"
              aria-label={`Edit ${event.title}`}
            >
              <Edit2 className="h-3 w-3" />
            </TouchOptimizedButton>
            <TouchOptimizedButton
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="h-8 w-8 p-0 text-destructive"
              aria-label={`Delete ${event.title}`}
            >
              <Trash2 className="h-3 w-3" />
            </TouchOptimizedButton>
          </div>
        )}
        
        {showTime && !event.allDay && (
          <span className={cn(
            "text-muted-foreground flex-shrink-0",
            isMobile ? "text-[10px]" : "text-xs"
          )}>
            {startTime}
          </span>
        )}

        {/* Bottom resize handle for time-based events */}
        {isResizable && isHovered && !event.allDay && (
          <div
            className="absolute -bottom-1 left-0 right-0 h-2 cursor-ns-resize flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
            onMouseDown={(e) => handleResizeStart(e, 'bottom')}
          >
            <div className="w-6 h-1 bg-blue-500 rounded-full" />
          </div>
        )}
      </div>
    );
  }

  return (
    <Card
      ref={(node) => {
        drag(node);
        cardRef.current = node;
      }}
      className={cn(
        "relative cursor-pointer transition-all duration-200 hover:shadow-md focus-visible-only",
        "touch-manipulation tap-highlight-transparent",
        isDragging && "opacity-50 transform rotate-1",
        isSelected && "ring-2 ring-blue-500 ring-offset-1",
        isResizing && "select-none",
        isMobile ? "p-2 min-h-touch" : "p-3",
        className
      )}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      role="button"
      tabIndex={isSelected ? 0 : -1}
      aria-label={eventAriaLabel}
      aria-selected={isSelected}
      aria-pressed={showActions}
    >
      {/* Top resize handle for time-based events */}
      {isResizable && isHovered && !event.allDay && (
        <div
          className="absolute -top-1 left-0 right-0 h-2 cursor-ns-resize flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity z-10"
          onMouseDown={(e) => handleResizeStart(e, 'top')}
        >
          <div className="w-8 h-1 bg-blue-500 rounded-full shadow-sm" />
        </div>
      )}

      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <div
              className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
              style={{ backgroundColor: colorStyle }}
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{event.title}</h4>
              {event.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {event.description}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {event.category && (
              <span className={cn(
                "bg-muted rounded-full",
                isMobile ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs"
              )}>
                {event.category}
              </span>
            )}
            
            {/* Desktop actions */}
            {!isMobile && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-muted"
                onClick={handleEdit}
                aria-label={`More actions for ${event.title}`}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            )}
            
            {/* Mobile actions */}
            {isMobile && touchOptimized && (showActions || isHovered) && (
              <div className="flex items-center gap-1">
                <TouchOptimizedButton
                  variant="ghost"
                  size="sm"
                  onClick={handleEdit}
                  className="h-8 w-8 p-0"
                  touchTarget="large"
                  aria-label={`Edit ${event.title}`}
                >
                  <Edit2 className="h-4 w-4" />
                </TouchOptimizedButton>
                <TouchOptimizedButton
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="h-8 w-8 p-0 text-destructive"
                  touchTarget="large"
                  aria-label={`Delete ${event.title}`}
                >
                  <Trash2 className="h-4 w-4" />
                </TouchOptimizedButton>
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-1 text-xs text-muted-foreground">
          {!event.allDay && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{timeRange}</span>
            </div>
          )}
          
          {event.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
          
          {event.attendees && event.attendees.length > 0 && (
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{event.attendees.length} attendees</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom resize handle for time-based events */}
      {isResizable && isHovered && !event.allDay && (
        <div
          className="absolute -bottom-1 left-0 right-0 h-2 cursor-ns-resize flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity z-10"
          onMouseDown={(e) => handleResizeStart(e, 'bottom')}
        >
          <div className="w-8 h-1 bg-blue-500 rounded-full shadow-sm" />
        </div>
      )}
    </Card>
  );
};

export default EventCard;