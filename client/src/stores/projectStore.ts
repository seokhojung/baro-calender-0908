import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { 
  Project, 
  ProjectColor, 
  ProjectFilters,
  CreateProjectInput,
  UpdateProjectInput,
  ApiError,
  PROJECT_COLORS,
  validateProjectName,
  validateProjectColor
} from '@/types/project';
import { useApolloClient } from '@apollo/client';
import { toast } from 'sonner';

// Enhanced Project Store Interface
interface ProjectState {
  // State
  projects: Project[]
  selectedProject: Project | null
  isLoading: boolean
  error: ApiError | null
  
  // Filters and Sorting
  sortBy: 'name' | 'createdAt' | 'order'
  sortDirection: 'asc' | 'desc'
  activeOnly: boolean
  colorFilter: ProjectColor[]
  
  // Selection
  selectedProjectIds: string[]
  
  // Performance tracking
  lastUpdated: Date | null
}

interface ProjectActions {
  // Core CRUD
  loadProjects: (filters?: ProjectFilters) => Promise<void>
  createProject: (input: CreateProjectInput) => Promise<Project>
  updateProject: (id: string, input: UpdateProjectInput) => Promise<Project>
  deleteProject: (id: string) => Promise<void>
  
  // Project Management
  selectProject: (project: Project | null) => void
  reorderProjects: (fromIndex: number, toIndex: number) => Promise<void>
  
  // Filtering and Sorting
  setSortBy: (sortBy: ProjectState['sortBy']) => void
  setSortDirection: (direction: ProjectState['sortDirection']) => void
  setActiveOnly: (activeOnly: boolean) => void
  setColorFilter: (colors: ProjectColor[]) => void
  
  // Selection
  setSelectedProjects: (ids: string[]) => void
  toggleProjectSelection: (id: string) => void
  clearSelection: () => void
  
  // Optimistic Updates
  optimisticUpdate: (id: string, updates: Partial<Project>) => void
  revertOptimisticUpdate: (id: string) => void
  
  // Utility
  refetch: () => Promise<void>
  resetStore: () => void
}

// Mock API with enhanced 8-color palette support
const mockAPI = {
  loadProjects: async (filters?: ProjectFilters): Promise<Project[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const mockProjects: Project[] = [
      {
        id: 'personal-red',
        name: 'Personal',
        description: 'Personal calendar events',
        color: 'red',
        isActive: true,
        members: [{
          userId: 'current-user',
          role: 'owner',
          permissions: ['project:read', 'project:write', 'project:delete', 'project:manage_members'],
          joinedAt: new Date('2024-01-01').toISOString()
        }],
        permissions: {
          canRead: true,
          canWrite: true,
          canDelete: true,
          canManageMembers: true
        },
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date().toISOString(),
        order: 0
      },
      {
        id: 'work-blue',
        name: 'Work Projects',
        description: 'Work-related tasks and meetings',
        color: 'blue',
        isActive: true,
        members: [{
          userId: 'current-user',
          role: 'admin',
          permissions: ['project:read', 'project:write', 'project:manage_members'],
          joinedAt: new Date('2024-01-15').toISOString()
        }],
        permissions: {
          canRead: true,
          canWrite: true,
          canDelete: false,
          canManageMembers: true
        },
        createdAt: new Date('2024-01-15').toISOString(),
        updatedAt: new Date().toISOString(),
        order: 1
      }
    ];
    
    // Apply filters
    let filteredProjects = mockProjects;
    if (filters?.isActive !== undefined) {
      filteredProjects = filteredProjects.filter(p => p.isActive === filters.isActive);
    }
    if (filters?.colors && filters.colors.length > 0) {
      filteredProjects = filteredProjects.filter(p => filters.colors!.includes(p.color));
    }
    
    return filteredProjects;
  },
  
  createProject: async (input: CreateProjectInput): Promise<Project> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (!validateProjectName(input.name)) {
      throw new Error('Invalid project name');
    }
    
    if (!validateProjectColor(input.color)) {
      throw new Error('Invalid project color');
    }
    
    const now = new Date().toISOString();
    return {
      id: Math.random().toString(36).substr(2, 9),
      name: input.name,
      description: input.description,
      color: input.color,
      isActive: input.isActive ?? true,
      members: [{
        userId: 'current-user',
        role: 'owner',
        permissions: ['project:read', 'project:write', 'project:delete', 'project:manage_members'],
        joinedAt: now
      }],
      permissions: {
        canRead: true,
        canWrite: true,
        canDelete: true,
        canManageMembers: true
      },
      createdAt: now,
      updatedAt: now,
      order: Date.now() // Simple ordering based on creation time
    };
  },
  
  updateProject: async (id: string, input: UpdateProjectInput): Promise<Project> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    if (input.name && !validateProjectName(input.name)) {
      throw new Error('Invalid project name');
    }
    
    if (input.color && !validateProjectColor(input.color)) {
      throw new Error('Invalid project color');
    }
    
    // Mock implementation - in real app, this would update the project
    return { 
      id, 
      ...input,
      updatedAt: new Date().toISOString()
    } as Project;
  },
  
  deleteProject: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    // Mock implementation
  },
  
  reorderProjects: async (updates: { id: string; order: number }[]): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 150));
    // Mock implementation
  }
};

type ProjectStore = ProjectState & ProjectActions;

const useProjectStore = create<ProjectStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        projects: [],
        selectedProject: null,
        isLoading: false,
        error: null,
        
        // Filters and Sorting
        sortBy: 'order',
        sortDirection: 'asc',
        activeOnly: false,
        colorFilter: [],
        
        // Selection
        selectedProjectIds: [],
        
        // Performance tracking
        lastUpdated: null,

        // Core CRUD Actions
        loadProjects: async (filters?: ProjectFilters) => {
          set({ isLoading: true, error: null });
          
          try {
            const projects = await mockAPI.loadProjects(filters);
            const sortedProjects = get().getSortedProjects(projects);
            
            set({
              projects: sortedProjects,
              selectedProject: sortedProjects.find(p => p.isActive) || sortedProjects[0] || null,
              lastUpdated: new Date(),
              isLoading: false
            });
            
            toast.success(`${projects.length}개 프로젝트를 불러왔습니다`);
            
          } catch (error) {
            const apiError: ApiError = {
              message: error instanceof Error ? error.message : 'Failed to load projects',
              code: 'LOAD_PROJECTS_ERROR'
            };
            set({ error: apiError, isLoading: false });
            toast.error('프로젝트 목록을 불러오는데 실패했습니다');
            throw error;
          }
        },

        createProject: async (input: CreateProjectInput) => {
          set({ isLoading: true, error: null });
          
          try {
            const newProject = await mockAPI.createProject(input);
            
            set((state) => ({
              projects: [...state.projects, newProject].sort((a, b) => a.order - b.order),
              selectedProject: newProject,
              lastUpdated: new Date(),
              isLoading: false
            }));
            
            toast.success(`프로젝트 "${newProject.name}"이 생성되었습니다`);
            return newProject;
            
          } catch (error) {
            const apiError: ApiError = {
              message: error instanceof Error ? error.message : 'Failed to create project',
              code: 'CREATE_PROJECT_ERROR'
            };
            set({ error: apiError, isLoading: false });
            toast.error('프로젝트 생성에 실패했습니다');
            throw error;
          }
        },

        updateProject: async (id: string, input: UpdateProjectInput) => {
          set({ isLoading: true, error: null });
          
          // Optimistic update
          const originalProject = get().projects.find(p => p.id === id);
          if (originalProject) {
            get().optimisticUpdate(id, input);
          }
          
          try {
            const updatedProject = await mockAPI.updateProject(id, input);
            
            set((state) => ({
              projects: state.projects.map(p => 
                p.id === id ? { ...p, ...updatedProject } : p
              ),
              selectedProject: state.selectedProject?.id === id 
                ? { ...state.selectedProject, ...updatedProject } 
                : state.selectedProject,
              lastUpdated: new Date(),
              isLoading: false
            }));
            
            toast.success(`프로젝트 "${updatedProject.name || originalProject?.name}"이 수정되었습니다`);
            return updatedProject;
            
          } catch (error) {
            // Revert optimistic update
            if (originalProject) {
              get().revertOptimisticUpdate(id);
            }
            
            const apiError: ApiError = {
              message: error instanceof Error ? error.message : 'Failed to update project',
              code: 'UPDATE_PROJECT_ERROR'
            };
            set({ error: apiError, isLoading: false });
            toast.error('프로젝트 수정에 실패했습니다');
            throw error;
          }
        },

        deleteProject: async (id: string) => {
          set({ isLoading: true, error: null });
          
          const projectToDelete = get().projects.find(p => p.id === id);
          
          try {
            await mockAPI.deleteProject(id);
            
            set((state) => {
              const remainingProjects = state.projects.filter(p => p.id !== id);
              return {
                projects: remainingProjects,
                selectedProject: state.selectedProject?.id === id 
                  ? remainingProjects[0] || null 
                  : state.selectedProject,
                selectedProjectIds: state.selectedProjectIds.filter(pid => pid !== id),
                lastUpdated: new Date(),
                isLoading: false
              };
            });
            
            toast.success(`프로젝트 "${projectToDelete?.name}"이 삭제되었습니다`);
            
          } catch (error) {
            const apiError: ApiError = {
              message: error instanceof Error ? error.message : 'Failed to delete project',
              code: 'DELETE_PROJECT_ERROR'
            };
            set({ error: apiError, isLoading: false });
            toast.error('프로젝트 삭제에 실패했습니다');
            throw error;
          }
        },

        // Project Management
        selectProject: (project: Project | null) => {
          set({ selectedProject: project });
        },

        reorderProjects: async (fromIndex: number, toIndex: number) => {
          const { projects } = get();
          
          // Optimistic update
          const newProjects = [...projects];
          const [removed] = newProjects.splice(fromIndex, 1);
          newProjects.splice(toIndex, 0, removed);
          
          const updatedProjects = newProjects.map((project, index) => ({
            ...project,
            order: index
          }));
          
          set({ projects: updatedProjects });
          
          try {
            const orderUpdates = updatedProjects.map(p => ({ id: p.id, order: p.order }));
            await mockAPI.reorderProjects(orderUpdates);
            
            set({ lastUpdated: new Date() });
            
          } catch (error) {
            // Revert optimistic update
            set({ projects });
            toast.error('프로젝트 순서 변경에 실패했습니다');
            throw error;
          }
        },

        // Filtering and Sorting
        setSortBy: (sortBy) => {
          set({ sortBy });
          const { projects } = get();
          const sortedProjects = get().getSortedProjects(projects);
          set({ projects: sortedProjects });
        },

        setSortDirection: (sortDirection) => {
          set({ sortDirection });
          const { projects } = get();
          const sortedProjects = get().getSortedProjects(projects);
          set({ projects: sortedProjects });
        },

        setActiveOnly: (activeOnly) => {
          set({ activeOnly });
        },

        setColorFilter: (colorFilter) => {
          set({ colorFilter });
        },

        // Selection
        setSelectedProjects: (ids: string[]) => {
          set({ selectedProjectIds: ids });
        },

        toggleProjectSelection: (id: string) => {
          set((state) => ({
            selectedProjectIds: state.selectedProjectIds.includes(id)
              ? state.selectedProjectIds.filter(pid => pid !== id)
              : [...state.selectedProjectIds, id]
          }));
        },

        clearSelection: () => {
          set({ selectedProjectIds: [] });
        },

        // Optimistic Updates
        optimisticUpdate: (id: string, updates: Partial<Project>) => {
          set((state) => ({
            projects: state.projects.map(p => 
              p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
            ),
            selectedProject: state.selectedProject?.id === id 
              ? { ...state.selectedProject, ...updates, updatedAt: new Date().toISOString() } 
              : state.selectedProject
          }));
        },

        revertOptimisticUpdate: (id: string) => {
          // This would need the original project stored somewhere
          // For now, we'll just refetch
          get().refetch();
        },

        // Utility
        refetch: async () => {
          const { activeOnly, colorFilter } = get();
          const filters: ProjectFilters = {
            isActive: activeOnly || undefined,
            colors: colorFilter.length > 0 ? colorFilter : undefined
          };
          await get().loadProjects(filters);
        },

        resetStore: () => {
          set({
            projects: [],
            selectedProject: null,
            isLoading: false,
            error: null,
            sortBy: 'order',
            sortDirection: 'asc',
            activeOnly: false,
            colorFilter: [],
            selectedProjectIds: [],
            lastUpdated: null
          });
        },

        // Helper methods (not persisted)
        getSortedProjects: (projects: Project[]) => {
          const { sortBy, sortDirection } = get();
          
          return [...projects].sort((a, b) => {
            let aValue: any, bValue: any;
            
            switch (sortBy) {
              case 'name':
                aValue = a.name.toLowerCase();
                bValue = b.name.toLowerCase();
                break;
              case 'createdAt':
                aValue = new Date(a.createdAt);
                bValue = new Date(b.createdAt);
                break;
              case 'order':
              default:
                aValue = a.order;
                bValue = b.order;
                break;
            }
            
            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
          });
        }
      }),
      {
        name: 'project-store-v2',
        version: 2,
        partialize: (state) => ({
          projects: state.projects,
          selectedProject: state.selectedProject,
          sortBy: state.sortBy,
          sortDirection: state.sortDirection,
          activeOnly: state.activeOnly,
          colorFilter: state.colorFilter,
          selectedProjectIds: state.selectedProjectIds
        })
      }
    ),
    {
      name: 'project-store-v2'
    }
  )
);

// Enhanced Selectors with 8-color palette support
export const useProjectSelectors = () => {
  const store = useProjectStore();
  
  return {
    getSelectedProject: () => store.selectedProject,
    
    getSelectedProjects: () => {
      return store.projects.filter(project => 
        store.selectedProjectIds.includes(project.id)
      );
    },
    
    getProjectById: (id: string) => {
      return store.projects.find(project => project.id === id) || null;
    },
    
    getActiveProjects: () => {
      return store.projects.filter(project => project.isActive);
    },
    
    getProjectsByColor: (color: ProjectColor) => {
      return store.projects.filter(project => project.color === color);
    },
    
    getProjectsByColors: (colors: ProjectColor[]) => {
      return store.projects.filter(project => colors.includes(project.color));
    },
    
    getFilteredProjects: () => {
      let filtered = [...store.projects];
      
      if (store.activeOnly) {
        filtered = filtered.filter(p => p.isActive);
      }
      
      if (store.colorFilter.length > 0) {
        filtered = filtered.filter(p => store.colorFilter.includes(p.color));
      }
      
      return filtered;
    },
    
    getProjectColorConfig: (project: Project) => {
      return PROJECT_COLORS[project.color];
    },
    
    getProjectStats: () => {
      const projects = store.projects;
      const colorCounts = Object.keys(PROJECT_COLORS).reduce((acc, color) => {
        acc[color as ProjectColor] = projects.filter(p => p.color === color).length;
        return acc;
      }, {} as Record<ProjectColor, number>);
      
      return {
        total: projects.length,
        active: projects.filter(p => p.isActive).length,
        inactive: projects.filter(p => !p.isActive).length,
        colorCounts
      };
    }
  };
};

// Real-time WebSocket hooks (for future implementation)
export const useProjectRealtime = () => {
  const { 
    loadProjects, 
    createProject, 
    updateProject, 
    deleteProject 
  } = useProjectStore();
  
  // This will be implemented with GraphQL subscriptions
  return {
    isConnected: false, // Will be managed by WebSocket connection
    lastUpdate: null,
    subscribe: () => {},
    unsubscribe: () => {}
  };
};

// Named exports for convenient importing
export { useProjectStore };

export default useProjectStore;