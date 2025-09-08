import { act, renderHook, waitFor } from '@testing-library/react';
import useProjectStore from '../projectStore';
import { Project, CreateProjectInput, UpdateProjectInput } from '@/types/project';

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn()
  }
}));

// Mock setTimeout for async operations
jest.useFakeTimers();

const mockProject: Project = {
  id: 'test-project-1',
  name: 'Test Project',
  description: 'Test description',
  color: 'blue',
  isActive: true,
  members: [{
    userId: 'current-user',
    role: 'owner',
    permissions: ['project:read', 'project:write', 'project:delete'],
    joinedAt: '2024-01-01T00:00:00Z'
  }],
  permissions: {
    canRead: true,
    canWrite: true,
    canDelete: true,
    canManageMembers: true
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  order: 0
};

describe('useProjectStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    const { resetStore } = useProjectStore.getState();
    resetStore();
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useProjectStore());

      expect(result.current.projects).toEqual([]);
      expect(result.current.selectedProject).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.sortBy).toBe('order');
      expect(result.current.sortDirection).toBe('asc');
      expect(result.current.activeOnly).toBe(false);
      expect(result.current.colorFilter).toEqual([]);
      expect(result.current.selectedProjectIds).toEqual([]);
    });
  });

  describe('loadProjects', () => {
    it('should load projects successfully', async () => {
      const { result } = renderHook(() => useProjectStore());

      act(() => {
        result.current.loadProjects();
      });

      expect(result.current.isLoading).toBe(true);

      // Fast-forward timers to simulate async completion
      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.projects).toHaveLength(2); // Mock returns 2 projects
        expect(result.current.selectedProject).toBeDefined();
      });
    });

    it('should handle load errors', async () => {
      // Mock console.error to avoid error logs in test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useProjectStore());

      // Mock the API to throw an error
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      act(() => {
        result.current.loadProjects();
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeDefined();
        expect(result.current.error?.message).toContain('Failed to load projects');
      });

      global.fetch = originalFetch;
      consoleSpy.mockRestore();
    });
  });

  describe('createProject', () => {
    it('should create project successfully', async () => {
      const { result } = renderHook(() => useProjectStore());

      const newProjectInput: CreateProjectInput = {
        name: 'New Project',
        description: 'New description',
        color: 'red',
        isActive: true
      };

      let createdProject: Project | undefined;

      await act(async () => {
        createdProject = await result.current.createProject(newProjectInput);
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(createdProject).toBeDefined();
      expect(createdProject?.name).toBe('New Project');
      expect(result.current.projects).toContainEqual(
        expect.objectContaining({
          name: 'New Project',
          color: 'red'
        })
      );
    });

    it('should handle create errors', async () => {
      const { result } = renderHook(() => useProjectStore());

      const invalidInput: CreateProjectInput = {
        name: '', // Invalid empty name
        color: 'blue'
      };

      await expect(
        act(async () => {
          await result.current.createProject(invalidInput);
        })
      ).rejects.toThrow();

      expect(result.current.error).toBeDefined();
    });
  });

  describe('updateProject', () => {
    it('should update project successfully with optimistic update', async () => {
      const { result } = renderHook(() => useProjectStore());

      // First load projects
      act(() => {
        result.current.loadProjects();
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.projects).toHaveLength(2);
      });

      const projectToUpdate = result.current.projects[0];
      const updateInput: UpdateProjectInput = {
        name: 'Updated Project Name'
      };

      await act(async () => {
        await result.current.updateProject(projectToUpdate.id, updateInput);
      });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      const updatedProject = result.current.projects.find(p => p.id === projectToUpdate.id);
      expect(updatedProject?.name).toBe('Updated Project Name');
    });
  });

  describe('deleteProject', () => {
    it('should delete project successfully', async () => {
      const { result } = renderHook(() => useProjectStore());

      // First load projects
      act(() => {
        result.current.loadProjects();
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.projects).toHaveLength(2);
      });

      const projectToDelete = result.current.projects[0];
      const initialCount = result.current.projects.length;

      await act(async () => {
        await result.current.deleteProject(projectToDelete.id);
      });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(result.current.projects).toHaveLength(initialCount - 1);
      expect(result.current.projects.find(p => p.id === projectToDelete.id)).toBeUndefined();
    });
  });

  describe('selectProject', () => {
    it('should select project', () => {
      const { result } = renderHook(() => useProjectStore());

      act(() => {
        result.current.selectProject(mockProject);
      });

      expect(result.current.selectedProject).toEqual(mockProject);
    });

    it('should deselect project when passing null', () => {
      const { result } = renderHook(() => useProjectStore());

      act(() => {
        result.current.selectProject(mockProject);
      });

      expect(result.current.selectedProject).toEqual(mockProject);

      act(() => {
        result.current.selectProject(null);
      });

      expect(result.current.selectedProject).toBeNull();
    });
  });

  describe('sorting and filtering', () => {
    it('should update sort settings', () => {
      const { result } = renderHook(() => useProjectStore());

      act(() => {
        result.current.setSortBy('name');
      });

      expect(result.current.sortBy).toBe('name');

      act(() => {
        result.current.setSortDirection('desc');
      });

      expect(result.current.sortDirection).toBe('desc');
    });

    it('should update filter settings', () => {
      const { result } = renderHook(() => useProjectStore());

      act(() => {
        result.current.setActiveOnly(true);
      });

      expect(result.current.activeOnly).toBe(true);

      act(() => {
        result.current.setColorFilter(['red', 'blue']);
      });

      expect(result.current.colorFilter).toEqual(['red', 'blue']);
    });
  });

  describe('project selection', () => {
    it('should manage selected project IDs', () => {
      const { result } = renderHook(() => useProjectStore());

      act(() => {
        result.current.setSelectedProjects(['project-1', 'project-2']);
      });

      expect(result.current.selectedProjectIds).toEqual(['project-1', 'project-2']);

      act(() => {
        result.current.toggleProjectSelection('project-3');
      });

      expect(result.current.selectedProjectIds).toEqual(['project-1', 'project-2', 'project-3']);

      act(() => {
        result.current.toggleProjectSelection('project-1');
      });

      expect(result.current.selectedProjectIds).toEqual(['project-2', 'project-3']);

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedProjectIds).toEqual([]);
    });
  });

  describe('reorderProjects', () => {
    it('should reorder projects with optimistic update', async () => {
      const { result } = renderHook(() => useProjectStore());

      // First load projects
      act(() => {
        result.current.loadProjects();
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.projects).toHaveLength(2);
      });

      const initialOrder = result.current.projects.map(p => p.id);

      await act(async () => {
        await result.current.reorderProjects(0, 1);
      });

      act(() => {
        jest.advanceTimersByTime(150);
      });

      const newOrder = result.current.projects.map(p => p.id);
      expect(newOrder).not.toEqual(initialOrder);
      expect(newOrder).toEqual([initialOrder[1], initialOrder[0]]);
    });
  });

  describe('optimistic updates', () => {
    it('should perform optimistic update', () => {
      const { result } = renderHook(() => useProjectStore());

      // Set up initial state with a project
      act(() => {
        result.current.selectProject(mockProject);
      });

      const update = { name: 'Optimistically Updated Name' };

      act(() => {
        result.current.optimisticUpdate(mockProject.id, update);
      });

      expect(result.current.selectedProject?.name).toBe('Optimistically Updated Name');
    });
  });

  describe('resetStore', () => {
    it('should reset store to initial state', () => {
      const { result } = renderHook(() => useProjectStore());

      // Set up some state
      act(() => {
        result.current.selectProject(mockProject);
        result.current.setActiveOnly(true);
        result.current.setColorFilter(['red']);
        result.current.setSelectedProjects(['project-1']);
      });

      // Reset store
      act(() => {
        result.current.resetStore();
      });

      expect(result.current.selectedProject).toBeNull();
      expect(result.current.activeOnly).toBe(false);
      expect(result.current.colorFilter).toEqual([]);
      expect(result.current.selectedProjectIds).toEqual([]);
    });
  });
});