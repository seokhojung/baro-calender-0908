'use client';

import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { GripVertical } from 'lucide-react';
import { ProjectCard } from './ProjectCard';
import { cn } from '@/lib/utils';
import { Project } from '@/types/project';

interface DragItem {
  index: number;
  id: string;
  type: string;
}

interface DraggableProjectCardProps {
  project: Project;
  index: number;
  isSelected?: boolean;
  onSelect?: (project: Project) => void;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  onToggleActive?: (project: Project) => void;
  onDrop: (dragIndex: number, dropIndex: number) => void;
  className?: string;
}

export const DraggableProjectCard: React.FC<DraggableProjectCardProps> = ({
  project,
  index,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onToggleActive,
  onDrop,
  className
}) => {
  const ref = useRef<HTMLDivElement>(null);
  
  const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: any }>({
    accept: 'project-card',
    collect: (monitor) => ({
      handlerId: monitor.getHandlerId()
    }),
    hover: (item: DragItem, monitor) => {
      if (!ref.current) {
        return;
      }
      
      const dragIndex = item.index;
      const hoverIndex = index;
      
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }
      
      // Determine rectangle on screen
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      
      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      
      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      
      // Get pixels to the top
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;
      
      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%
      
      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      
      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      
      // Time to actually perform the action
      onDrop(dragIndex, hoverIndex);
      
      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    }
  });
  
  const [{ isDragging }, drag, preview] = useDrag({
    type: 'project-card',
    item: () => ({
      id: project.id,
      index,
      type: 'project-card'
    }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });
  
  // Create drag handle
  const [, dragHandle] = useDrag({
    type: 'project-card',
    item: () => ({
      id: project.id,
      index,
      type: 'project-card'
    }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });
  
  // Connect drag and drop refs
  preview(drop(ref));
  
  const opacity = isDragging ? 0.4 : 1;
  
  return (
    <div
      ref={ref}
      className={cn(
        "relative group",
        isDragging && "z-10",
        className
      )}
      style={{ opacity }}
      data-handler-id={handlerId as string}
    >
      {/* Drag Handle */}
      <div
        ref={dragHandle as any}
        className={cn(
          "absolute left-1 top-1/2 -translate-y-1/2 z-10",
          "opacity-0 group-hover:opacity-100 transition-opacity",
          "cursor-grab active:cursor-grabbing",
          "bg-background/80 backdrop-blur-sm rounded p-1",
          "hover:bg-accent"
        )}
        role="button"
        tabIndex={0}
        aria-label="프로젝트 순서 변경"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            // Handle keyboard-based dragging if needed
          }
        }}
      >
        <GripVertical className="w-3 h-3 text-muted-foreground" />
      </div>
      
      {/* Project Card */}
      <div className="pl-6">
        <ProjectCard
          project={project}
          isSelected={isSelected}
          onSelect={onSelect}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleActive={onToggleActive}
          className={cn(
            "transition-all duration-200",
            isDragging && "shadow-xl scale-105 rotate-1"
          )}
        />
      </div>
      
      {/* Drop Indicator */}
      <div className="absolute inset-x-0 -top-1 h-0.5 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};