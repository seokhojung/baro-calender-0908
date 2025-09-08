'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSpring, animated, config } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
import { Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Project } from '@/types/project';

interface SwipeAction {
  label: string;
  icon: React.ReactNode;
  color: 'blue' | 'red' | 'green' | 'yellow';
  onAction: () => void;
}

interface SwipeToActionProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  threshold?: number;
  className?: string;
  disabled?: boolean;
}

const ACTION_COLORS = {
  blue: 'bg-blue-500 text-white',
  red: 'bg-red-500 text-white',
  green: 'bg-green-500 text-white',
  yellow: 'bg-yellow-500 text-white'
};

export const SwipeToAction: React.FC<SwipeToActionProps> = ({
  children,
  leftActions = [],
  rightActions = [],
  threshold = 80,
  className,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<SwipeAction | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [{ x }, api] = useSpring(() => ({ x: 0 }));
  
  const bind = useDrag(
    ({ active, movement: [mx], direction: [xDir], distance, cancel }) => {
      if (disabled) return;
      
      const trigger = distance > threshold;
      
      // Determine which actions to show based on swipe direction
      const actions = mx < 0 ? rightActions : leftActions;
      
      if (active && trigger && actions.length > 0) {
        // Show action preview
        const actionIndex = Math.min(Math.floor(Math.abs(mx) / threshold) - 1, actions.length - 1);
        setActiveAction(actions[actionIndex] || null);
      } else {
        setActiveAction(null);
      }
      
      // Limit swipe distance based on available actions
      const maxLeft = leftActions.length * threshold;
      const maxRight = rightActions.length * threshold;
      const limitedMx = Math.max(-maxRight, Math.min(maxLeft, mx));
      
      api.start({
        x: active ? limitedMx : 0,
        config: active ? config.stiff : config.wobbly,
        immediate: active
      });
      
      // Execute action on release if threshold is met
      if (!active && trigger && activeAction) {
        activeAction.onAction();
        cancel();
        setActiveAction(null);
      }
      
      setIsOpen(active && trigger);
    },
    {
      axis: 'x',
      bounds: { left: -rightActions.length * threshold, right: leftActions.length * threshold },
      rubberband: true
    }
  );
  
  // Close swipe on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        api.start({ x: 0 });
        setIsOpen(false);
        setActiveAction(null);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, api]);
  
  return (
    <div 
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
    >
      {/* Left Actions */}
      {leftActions.length > 0 && (
        <div className="absolute left-0 top-0 h-full flex">
          {leftActions.map((action, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center justify-center px-4 transition-all duration-200",
                ACTION_COLORS[action.color],
                "min-w-[80px]"
              )}
              style={{ width: threshold }}
              onClick={(e) => {
                e.stopPropagation();
                action.onAction();
                api.start({ x: 0 });
                setIsOpen(false);
              }}
            >
              <div className="flex flex-col items-center gap-1">
                {action.icon}
                <span className="text-xs font-medium">{action.label}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Right Actions */}
      {rightActions.length > 0 && (
        <div className="absolute right-0 top-0 h-full flex">
          {rightActions.map((action, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center justify-center px-4 transition-all duration-200",
                ACTION_COLORS[action.color],
                "min-w-[80px]"
              )}
              style={{ width: threshold }}
              onClick={(e) => {
                e.stopPropagation();
                action.onAction();
                api.start({ x: 0 });
                setIsOpen(false);
              }}
            >
              <div className="flex flex-col items-center gap-1">
                {action.icon}
                <span className="text-xs font-medium">{action.label}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Main Content */}
      <animated.div
        {...bind()}
        style={{ x }}
        className="relative z-10 bg-background touch-pan-y"
      >
        {children}
      </animated.div>
      
      {/* Active Action Indicator */}
      {activeAction && (
        <div className="absolute top-2 right-2 z-20 bg-black/80 text-white px-2 py-1 rounded text-xs">
          {activeAction.label}
        </div>
      )}
    </div>
  );
};

// Mobile Project Card with swipe actions
interface ProjectMobileCardProps {
  project: Project;
  isSelected?: boolean;
  onSelect?: (project: Project) => void;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  onToggleActive?: (project: Project) => void;
  className?: string;
}

export const ProjectMobileCard: React.FC<ProjectMobileCardProps> = ({
  project,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onToggleActive,
  className
}) => {
  const leftActions: SwipeAction[] = [];
  const rightActions: SwipeAction[] = [];
  
  // Add edit action to left swipe if user has permission
  if (project.permissions.canWrite && onEdit) {
    leftActions.push({
      label: '편집',
      icon: <Edit className="w-5 h-5" />,
      color: 'blue',
      onAction: () => onEdit(project)
    });
  }
  
  // Add toggle active action
  if (onToggleActive) {
    leftActions.push({
      label: project.isActive ? '비활성' : '활성',
      icon: project.isActive ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />,
      color: 'yellow',
      onAction: () => onToggleActive(project)
    });
  }
  
  // Add delete action to right swipe if user has permission
  if (project.permissions.canDelete && onDelete) {
    rightActions.push({
      label: '삭제',
      icon: <Trash2 className="w-5 h-5" />,
      color: 'red',
      onAction: () => onDelete(project)
    });
  }
  
  return (
    <div className={cn("min-h-[44px] touch-manipulation", className)}>
      <SwipeToAction
        leftActions={leftActions}
        rightActions={rightActions}
        disabled={leftActions.length === 0 && rightActions.length === 0}
      >
        <div
          className={cn(
            "p-3 border-b border-border/50 active:bg-accent transition-colors",
            isSelected && "bg-accent"
          )}
          onClick={() => onSelect?.(project)}
        >
          {/* Project content will be rendered by the parent component */}
          {/* This is just the container for swipe actions */}
          <div className="min-h-[38px]">
            {/* Content placeholder - actual content should be passed as children */}
          </div>
        </div>
      </SwipeToAction>
    </div>
  );
};