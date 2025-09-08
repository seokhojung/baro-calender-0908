'use client';

import React, { memo } from 'react';
import { MoreHorizontal, Users, Calendar, Settings } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { ColorIndicator } from './ColorPicker';
import { cn } from '@/lib/utils';
import { Project, getProjectColorConfig } from '@/types/project';

interface ProjectCardProps {
  project: Project;
  isSelected?: boolean;
  onSelect?: (project: Project) => void;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  onToggleActive?: (project: Project) => void;
  className?: string;
}

export const ProjectCard = memo<ProjectCardProps>(({
  project,
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  onToggleActive,
  className
}) => {
  const colorConfig = getProjectColorConfig(project.color);
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onSelect?.(project);
  };
  
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(project);
  };
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(project);
  };
  
  const handleToggleActive = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleActive?.(project);
  };
  
  return (
    <Card 
      className={cn(
        "group cursor-pointer transition-all duration-200 hover:shadow-md",
        "border-l-4 hover:scale-[1.01]",
        isSelected && "ring-2 ring-blue-500 ring-offset-2",
        !project.isActive && "opacity-60",
        className
      )}
      style={{
        borderLeftColor: colorConfig.primary,
        '--project-primary': colorConfig.primary,
        '--project-secondary': colorConfig.secondary,
      } as React.CSSProperties}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`프로젝트 ${project.name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e as any);
        }
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <ColorIndicator color={project.color} size="md" />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm truncate">
                  {project.name}
                </h3>
                {!project.isActive && (
                  <Badge variant="secondary" className="text-xs">
                    비활성
                  </Badge>
                )}
              </div>
              
              {project.description && (
                <p className="text-xs text-muted-foreground truncate">
                  {project.description}
                </p>
              )}
              
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="w-3 h-3" />
                  <span>{project.members.length}명</span>
                </div>
                
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {new Date(project.createdAt).toLocaleDateString('ko-KR', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
                aria-label="프로젝트 옵션"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                프로젝트 편집
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleActive} className="cursor-pointer">
                {project.isActive ? (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    비활성화
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    활성화
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleDelete} 
                className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
                disabled={!project.permissions.canDelete}
              >
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.project.id === nextProps.project.id &&
    prevProps.project.name === nextProps.project.name &&
    prevProps.project.color === nextProps.project.color &&
    prevProps.project.isActive === nextProps.project.isActive &&
    prevProps.project.members.length === nextProps.project.members.length &&
    prevProps.project.updatedAt === nextProps.project.updatedAt &&
    prevProps.isSelected === nextProps.isSelected
  );
});

ProjectCard.displayName = 'ProjectCard';