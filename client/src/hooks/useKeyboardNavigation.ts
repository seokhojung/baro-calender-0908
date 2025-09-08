'use client';

import { useCallback, useEffect, useState } from 'react';
import { Project } from '@/types/project';
import useProjectStore from '@/stores/projectStore';

interface UseKeyboardNavigationOptions {
  enabled?: boolean;
  enableProjectSelection?: boolean;
  enableProjectActions?: boolean;
  onProjectOpen?: (project: Project) => void;
  onProjectEdit?: (project: Project) => void;
  onProjectDelete?: (project: Project) => void;
}

export const useKeyboardNavigation = (options: UseKeyboardNavigationOptions = {}) => {
  const {
    enabled = true,
    enableProjectSelection = true,
    enableProjectActions = true,
    onProjectOpen,
    onProjectEdit,
    onProjectDelete
  } = options;
  
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [isActive, setIsActive] = useState(false);
  
  const { projects, selectedProject, selectProject } = useProjectStore();
  
  // Navigation functions
  const selectNextProject = useCallback(() => {
    if (!enableProjectSelection || projects.length === 0) return;
    
    const currentIndex = focusedIndex >= 0 ? focusedIndex : -1;
    const nextIndex = (currentIndex + 1) % projects.length;
    setFocusedIndex(nextIndex);
    
    const nextProject = projects[nextIndex];
    if (nextProject) {
      selectProject(nextProject);
    }
  }, [projects, focusedIndex, selectProject, enableProjectSelection]);
  
  const selectPreviousProject = useCallback(() => {
    if (!enableProjectSelection || projects.length === 0) return;
    
    const currentIndex = focusedIndex >= 0 ? focusedIndex : projects.length;
    const prevIndex = currentIndex <= 0 ? projects.length - 1 : currentIndex - 1;
    setFocusedIndex(prevIndex);
    
    const prevProject = projects[prevIndex];
    if (prevProject) {
      selectProject(prevProject);
    }
  }, [projects, focusedIndex, selectProject, enableProjectSelection]);
  
  const selectFirstProject = useCallback(() => {
    if (!enableProjectSelection || projects.length === 0) return;
    
    setFocusedIndex(0);
    const firstProject = projects[0];
    if (firstProject) {
      selectProject(firstProject);
    }
  }, [projects, selectProject, enableProjectSelection]);
  
  const selectLastProject = useCallback(() => {
    if (!enableProjectSelection || projects.length === 0) return;
    
    const lastIndex = projects.length - 1;
    setFocusedIndex(lastIndex);
    const lastProject = projects[lastIndex];
    if (lastProject) {
      selectProject(lastProject);
    }
  }, [projects, selectProject, enableProjectSelection]);
  
  const openSelectedProject = useCallback(() => {
    if (!selectedProject || !onProjectOpen) return;
    onProjectOpen(selectedProject);
  }, [selectedProject, onProjectOpen]);
  
  const editSelectedProject = useCallback(() => {
    if (!selectedProject || !onProjectEdit || !selectedProject.permissions.canWrite) return;
    onProjectEdit(selectedProject);
  }, [selectedProject, onProjectEdit]);
  
  const deleteSelectedProject = useCallback(() => {
    if (!selectedProject || !onProjectDelete || !selectedProject.permissions.canDelete) return;
    onProjectDelete(selectedProject);
  }, [selectedProject, onProjectDelete]);
  
  // Keyboard event handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled || !isActive) return;
    
    // Check if we're in an input or textarea
    const activeElement = document.activeElement;
    if (activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.getAttribute('contenteditable') === 'true'
    )) {
      return;
    }
    
    switch (event.key) {
      case 'ArrowDown':
      case 'j':
        event.preventDefault();
        selectNextProject();
        break;
        
      case 'ArrowUp':
      case 'k':
        event.preventDefault();
        selectPreviousProject();
        break;
        
      case 'Home':
      case 'g':
        if (event.key === 'g' && !event.ctrlKey) {
          // Check for 'gg' pattern (vim-style)
          const now = Date.now();
          const lastG = (handleKeyDown as any).lastGTime || 0;
          if (now - lastG < 500) {
            event.preventDefault();
            selectFirstProject();
            (handleKeyDown as any).lastGTime = 0;
          } else {
            (handleKeyDown as any).lastGTime = now;
          }
        } else {
          event.preventDefault();
          selectFirstProject();
        }
        break;
        
      case 'End':
      case 'G':
        event.preventDefault();
        selectLastProject();
        break;
        
      case 'Enter':
      case ' ':
        event.preventDefault();
        openSelectedProject();
        break;
        
      case 'e':
        if (enableProjectActions) {
          event.preventDefault();
          editSelectedProject();
        }
        break;
        
      case 'Delete':
      case 'Backspace':
        if (enableProjectActions && (event.shiftKey || event.ctrlKey)) {
          event.preventDefault();
          deleteSelectedProject();
        }
        break;
        
      case 'Escape':
        event.preventDefault();
        setIsActive(false);
        setFocusedIndex(-1);
        // Remove focus from any focused element
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        break;
        
      case 'Tab':
        // Allow tab navigation but activate keyboard mode
        setIsActive(true);
        break;
    }
  }, [
    enabled,
    isActive,
    enableProjectActions,
    selectNextProject,
    selectPreviousProject,
    selectFirstProject,
    selectLastProject,
    openSelectedProject,
    editSelectedProject,
    deleteSelectedProject
  ]);
  
  // Focus event handler
  const handleFocus = useCallback(() => {
    setIsActive(true);
  }, []);
  
  // Click event handler
  const handleClick = useCallback(() => {
    setIsActive(false);
  }, []);
  
  // Setup event listeners
  useEffect(() => {
    if (!enabled) return;
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', handleFocus);
    document.addEventListener('click', handleClick);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('click', handleClick);
    };
  }, [enabled, handleKeyDown, handleFocus, handleClick]);
  
  // Update focused index when projects change
  useEffect(() => {
    if (!selectedProject || projects.length === 0) {
      setFocusedIndex(-1);
      return;
    }
    
    const index = projects.findIndex(p => p.id === selectedProject.id);
    setFocusedIndex(index);
  }, [selectedProject, projects]);
  
  return {
    focusedIndex,
    isActive,
    focusedProject: focusedIndex >= 0 ? projects[focusedIndex] : null,
    selectNextProject,
    selectPreviousProject,
    selectFirstProject,
    selectLastProject,
    openSelectedProject,
    editSelectedProject,
    deleteSelectedProject,
    setActive: setIsActive
  };
};