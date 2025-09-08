"use client";

import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  Filter,
  Plus,
  Settings 
} from 'lucide-react';
import { useCalendar } from '@/components/providers/calendar-provider';
import { useProjectStore } from '@/stores/projectStore';
import { ViewMode } from '@/types/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface CalendarHeaderProps {
  className?: string;
  onEventCreate?: () => void;
  onSettings?: () => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  className,
  onEventCreate,
  onSettings
}) => {
  const { store, dateUtils, isReady } = useCalendar();
  const projectStore = useProjectStore();

  const handlePrevious = () => {
    const newDate = dateUtils.navigatePrevious(store.currentDate, store.viewMode);
    store.setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = dateUtils.navigateNext(store.currentDate, store.viewMode);
    store.setCurrentDate(newDate);
  };

  const handleToday = () => {
    store.setCurrentDate(new Date());
  };

  const handleViewModeChange = (viewMode: ViewMode) => {
    store.setViewMode(viewMode);
  };

  const getViewModeTitle = () => {
    if (!isReady) return 'Loading...';
    return dateUtils.getViewModeTitle(store.currentDate, store.viewMode);
  };

  const getActiveProjectsCount = () => {
    return projectStore.selectedProjectIds.length || projectStore.projects.filter(p => p.isActive).length;
  };

  const handleProjectToggle = (projectId: string, checked: boolean) => {
    if (checked) {
      projectStore.setSelectedProjects([...projectStore.selectedProjectIds, projectId]);
    } else {
      projectStore.setSelectedProjects(
        projectStore.selectedProjectIds.filter(id => id !== projectId)
      );
    }
  };

  const viewModeOptions = [
    { value: 'month', label: 'Month' },
    { value: 'week', label: 'Week' },
    { value: 'day', label: 'Day' },
    { value: 'year', label: 'Year' }
  ];

  return (
    <Card className={cn("mb-4", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left section - Navigation and title */}
          <div className="flex items-center gap-4">
            {/* Navigation buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={!isReady || store.isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleToday}
                disabled={!isReady || store.isLoading}
              >
                Today
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={!isReady || store.isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Current period title */}
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">
                {getViewModeTitle()}
              </h2>
            </div>
          </div>

          {/* Right section - Actions and filters */}
          <div className="flex items-center gap-2">
            {/* View mode selector */}
            <Select
              value={store.viewMode}
              onValueChange={handleViewModeChange}
              disabled={!isReady || store.isLoading}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {viewModeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Project filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Projects
                  {getActiveProjectsCount() > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5">
                      {getActiveProjectsCount()}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Filter by Projects</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {projectStore.projects.length === 0 ? (
                  <DropdownMenuItem disabled>
                    No projects available
                  </DropdownMenuItem>
                ) : (
                  projectStore.projects.map((project) => {
                    const isSelected = projectStore.selectedProjectIds.length > 0 
                      ? projectStore.selectedProjectIds.includes(project.id)
                      : project.isActive;
                    
                    return (
                      <DropdownMenuCheckboxItem
                        key={project.id}
                        checked={isSelected}
                        onCheckedChange={(checked) => handleProjectToggle(project.id, checked)}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: project.color }}
                          />
                          {project.name}
                        </div>
                      </DropdownMenuCheckboxItem>
                    );
                  })
                )}
                
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => projectStore.setSelectedProjects([])}>
                  Clear filters
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Create event button */}
            <Button onClick={onEventCreate} disabled={!isReady}>
              <Plus className="h-4 w-4 mr-2" />
              New Event
            </Button>

            {/* Settings button */}
            <Button variant="outline" size="sm" onClick={onSettings}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Loading indicator */}
        {store.isLoading && (
          <div className="mt-2">
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 animate-pulse" />
            </div>
          </div>
        )}

        {/* Error message */}
        {store.error && (
          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-700 dark:text-red-400">{store.error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CalendarHeader;