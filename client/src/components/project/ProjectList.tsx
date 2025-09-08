'use client';

import React, { useCallback, useEffect, useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { Plus, Filter, SortAsc, SortDesc } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { DraggableProjectCard } from './DraggableProjectCard';
import { ColorIndicator } from './ColorPicker';
import { cn } from '@/lib/utils';
import { Project, ProjectColor, PROJECT_COLORS } from '@/types/project';
import useProjectStore, { useProjectSelectors } from '@/stores/projectStore';

interface ProjectListProps {
  onCreateProject?: () => void;
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (project: Project) => void;
  className?: string;
}

// Hook to detect mobile devices
const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = React.useState(false);
  
  React.useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addListener(listener);
    return () => media.removeListener(listener);
  }, [matches, query]);
  
  return matches;
};

export const ProjectList: React.FC<ProjectListProps> = ({
  onCreateProject,
  onEditProject,
  onDeleteProject,
  className
}) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Store hooks
  const {
    projects,
    selectedProject,
    isLoading,
    error,
    sortBy,
    sortDirection,
    activeOnly,
    colorFilter,
    loadProjects,
    selectProject,
    reorderProjects,
    updateProject,
    setSortBy,
    setSortDirection,
    setActiveOnly,
    setColorFilter
  } = useProjectStore();
  
  const { getFilteredProjects, getProjectStats } = useProjectSelectors();
  
  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);
  
  // Get filtered and sorted projects
  const displayProjects = useMemo(() => {
    return getFilteredProjects();
  }, [getFilteredProjects]);
  
  const stats = useMemo(() => {
    return getProjectStats();
  }, [getProjectStats]);
  
  // Drag and drop handler
  const handleDrop = useCallback((dragIndex: number, dropIndex: number) => {
    if (dragIndex === dropIndex) return;
    reorderProjects(dragIndex, dropIndex);
  }, [reorderProjects]);
  
  // Project handlers
  const handleSelectProject = useCallback((project: Project) => {
    selectProject(project.id === selectedProject?.id ? null : project);
  }, [selectProject, selectedProject?.id]);
  
  const handleToggleActive = useCallback(async (project: Project) => {
    try {
      await updateProject(project.id, { isActive: !project.isActive });
    } catch (error) {
      console.error('Failed to toggle project active status:', error);
    }
  }, [updateProject]);
  
  // Filter handlers
  const handleColorFilter = useCallback((color: ProjectColor) => {
    const newColors = colorFilter.includes(color)
      ? colorFilter.filter(c => c !== color)
      : [...colorFilter, color];
    setColorFilter(newColors);
  }, [colorFilter, setColorFilter]);
  
  const clearFilters = useCallback(() => {
    setActiveOnly(false);
    setColorFilter([]);
  }, [setActiveOnly, setColorFilter]);
  
  if (error) {
    return (
      <div className={cn("p-6 text-center", className)}>
        <div className="text-red-600 mb-4">
          프로젝트를 불러오는데 실패했습니다
        </div>
        <Button onClick={() => loadProjects()}>
          다시 시도
        </Button>
      </div>
    );
  }
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">프로젝트</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {displayProjects.length}개 프로젝트
            {(activeOnly || colorFilter.length > 0) && (
              <span className="ml-2 text-blue-600">
                (필터 적용됨)
              </span>
            )}
          </p>
        </div>
        
        <Button onClick={onCreateProject} className="gap-2">
          <Plus className="w-4 h-4" />
          새 프로젝트
        </Button>
      </div>
      
      {/* Filters and Sorting */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Sort Controls */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              {sortDirection === 'asc' ? (
                <SortAsc className="w-4 h-4" />
              ) : (
                <SortDesc className="w-4 h-4" />
              )}
              정렬
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>정렬 기준</DropdownMenuLabel>
            <DropdownMenuRadioGroup 
              value={sortBy} 
              onValueChange={(value) => setSortBy(value as any)}
            >
              <DropdownMenuRadioItem value="order">순서</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="name">이름</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="createdAt">생성일</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>정렬 방향</DropdownMenuLabel>
            <DropdownMenuRadioGroup 
              value={sortDirection} 
              onValueChange={(value) => setSortDirection(value as any)}
            >
              <DropdownMenuRadioItem value="asc">오름차순</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="desc">내림차순</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Filter Controls */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              필터
              {(activeOnly || colorFilter.length > 0) && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {(activeOnly ? 1 : 0) + colorFilter.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64">
            <DropdownMenuLabel>프로젝트 상태</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={activeOnly}
              onCheckedChange={setActiveOnly}
            >
              활성 프로젝트만 보기
            </DropdownMenuCheckboxItem>
            
            <DropdownMenuSeparator />
            <DropdownMenuLabel>색상별 필터</DropdownMenuLabel>
            {Object.entries(PROJECT_COLORS).map(([key, config]) => (
              <DropdownMenuCheckboxItem
                key={key}
                checked={colorFilter.includes(key as ProjectColor)}
                onCheckedChange={() => handleColorFilter(key as ProjectColor)}
              >
                <div className="flex items-center gap-2">
                  <ColorIndicator color={key as ProjectColor} size="sm" />
                  <span>{config.name}</span>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {stats.colorCounts[key as ProjectColor]}
                  </Badge>
                </div>
              </DropdownMenuCheckboxItem>
            ))}
            
            {(activeOnly || colorFilter.length > 0) && (
              <>
                <DropdownMenuSeparator />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  className="w-full justify-start"
                >
                  모든 필터 지우기
                </Button>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Active Filter Indicators */}
        {activeOnly && (
          <Badge variant="secondary" className="gap-1">
            활성 프로젝트
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-4 w-4 p-0 hover:bg-transparent"
              onClick={() => setActiveOnly(false)}
            >
              ×
            </Button>
          </Badge>
        )}
        
        {colorFilter.map(color => (
          <Badge key={color} variant="secondary" className="gap-2">
            <ColorIndicator color={color} size="sm" />
            {PROJECT_COLORS[color].name}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-4 w-4 p-0 hover:bg-transparent"
              onClick={() => handleColorFilter(color)}
            >
              ×
            </Button>
          </Badge>
        ))}
      </div>
      
      {/* Project List */}
      <DndProvider backend={isMobile ? TouchBackend : HTML5Backend}>
        <div className="space-y-3" role="list" aria-label="프로젝트 목록">
          {isLoading && displayProjects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              프로젝트를 불러오는 중...
            </div>
          ) : displayProjects.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                {projects.length === 0 
                  ? "아직 생성된 프로젝트가 없습니다" 
                  : "조건에 맞는 프로젝트가 없습니다"}
              </div>
              {projects.length === 0 ? (
                <Button onClick={onCreateProject}>
                  첫 번째 프로젝트 만들기
                </Button>
              ) : (
                <Button variant="outline" onClick={clearFilters}>
                  모든 필터 지우기
                </Button>
              )}
            </div>
          ) : (
            displayProjects.map((project, index) => (
              <div key={project.id} role="listitem">
                <DraggableProjectCard
                  project={project}
                  index={index}
                  isSelected={selectedProject?.id === project.id}
                  onSelect={handleSelectProject}
                  onEdit={onEditProject}
                  onDelete={onDeleteProject}
                  onToggleActive={handleToggleActive}
                  onDrop={handleDrop}
                />
              </div>
            ))
          )}
        </div>
      </DndProvider>
      
      {/* Project Stats */}
      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <div className="text-sm text-muted-foreground">
          <div className="flex justify-between items-center">
            <span>전체: {stats.total}개</span>
            <span>활성: {stats.active}개</span>
            <span>비활성: {stats.inactive}개</span>
          </div>
        </div>
      </div>
    </div>
  );
};