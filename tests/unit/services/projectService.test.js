/**
 * ProjectService 단위 테스트
 */

const ProjectService = require('../../../src/services/projectService');
const { Project } = require('../../../src/models/project');
const Member = require('../../../src/models/member');

// Mock models
jest.mock('../../../src/models/project');
jest.mock('../../../src/models/member');

describe('ProjectService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProject', () => {
    it('should create project and add owner as member successfully', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'Test description',
        color: '#FF6B6B',
        tenant_id: 1,
        owner_id: 1,
        settings: { default_view: 'month' }
      };

      const createdProject = {
        id: 1,
        ...projectData,
        created_at: new Date(),
        updated_at: new Date()
      };

      const createdMember = {
        id: 1,
        project_id: 1,
        user_id: 1,
        role: 'Owner'
      };

      // Mock Project.create
      Project.create.mockResolvedValue(createdProject);
      
      // Mock Member.create
      Member.create.mockResolvedValue(createdMember);

      const result = await ProjectService.createProject(projectData);

      expect(Project.create).toHaveBeenCalledWith(projectData);
      expect(Member.create).toHaveBeenCalledWith({
        tenant_id: projectData.tenant_id,
        project_id: createdProject.id,
        user_id: projectData.owner_id,
        role: 'Owner'
      });
      expect(result).toEqual(createdProject);
    });

    it('should handle project creation failure', async () => {
      const projectData = { name: 'Test Project', tenant_id: 1, owner_id: 1 };
      const error = new Error('Database error');

      Project.create.mockRejectedValue(error);

      await expect(ProjectService.createProject(projectData)).rejects.toThrow('Database error');
      expect(Member.create).not.toHaveBeenCalled();
    });

    it('should handle member creation failure', async () => {
      const projectData = { name: 'Test Project', tenant_id: 1, owner_id: 1 };
      const createdProject = { id: 1, ...projectData };
      const memberError = new Error('Member creation failed');

      Project.create.mockResolvedValue(createdProject);
      Member.create.mockRejectedValue(memberError);

      await expect(ProjectService.createProject(projectData)).rejects.toThrow('Member creation failed');
    });
  });

  describe('getProjectById', () => {
    it('should return project by ID', async () => {
      const projectId = 1;
      const expectedProject = {
        id: projectId,
        name: 'Test Project',
        tenant_id: 1,
        owner_id: 1
      };

      Project.findById.mockResolvedValue(expectedProject);

      const result = await ProjectService.getProjectById(projectId);

      expect(Project.findById).toHaveBeenCalledWith(projectId);
      expect(result).toEqual(expectedProject);
    });

    it('should return null when project not found', async () => {
      const projectId = 999;

      Project.findById.mockResolvedValue(null);

      const result = await ProjectService.getProjectById(projectId);

      expect(result).toBeNull();
    });
  });

  describe('updateProject', () => {
    it('should update project successfully', async () => {
      const projectId = 1;
      const updateData = { name: 'Updated Project' };
      const existingProject = {
        id: projectId,
        name: 'Test Project',
        tenant_id: 1,
        owner_id: 1
      };
      const updatedProject = {
        id: projectId,
        name: 'Updated Project',
        tenant_id: 1,
        owner_id: 1
      };

      Project.findById.mockResolvedValue(existingProject);
      Project.update.mockResolvedValue(updatedProject);

      const result = await ProjectService.updateProject(projectId, updateData);

      expect(Project.findById).toHaveBeenCalledWith(projectId);
      expect(Project.update).toHaveBeenCalledWith(projectId, updateData);
      expect(result).toEqual(updatedProject);
    });

    it('should return null when project not found', async () => {
      const projectId = 999;
      const updateData = { name: 'Updated' };

      Project.findById.mockResolvedValue(null);

      await expect(ProjectService.updateProject(projectId, updateData)).rejects.toThrow('Failed to update project: Project not found');
    });
  });

  describe('deleteProject', () => {
    it('should delete project when no active members', async () => {
      const projectId = 1;
      const existingProject = {
        id: projectId,
        name: 'Test Project',
        tenant_id: 1,
        owner_id: 1
      };
      const deletedProject = {
        id: projectId,
        name: 'Deleted Project'
      };

      // Mock existing project and no active members
      Project.findById.mockResolvedValue(existingProject);
      Member.countByProjectId.mockResolvedValue(1); // Only owner
      Project.delete.mockResolvedValue(deletedProject);

      const result = await ProjectService.deleteProject(projectId);

      expect(Project.findById).toHaveBeenCalledWith(projectId);
      expect(Member.countByProjectId).toHaveBeenCalledWith(projectId);
      expect(Project.delete).toHaveBeenCalledWith(projectId);
      expect(result).toEqual(deletedProject);
    });

    it('should throw error when project has active members', async () => {
      const projectId = 1;
      const existingProject = {
        id: projectId,
        name: 'Test Project',
        tenant_id: 1,
        owner_id: 1
      };

      // Mock existing project and active members exist
      Project.findById.mockResolvedValue(existingProject);
      Member.countByProjectId.mockResolvedValue(3);

      await expect(ProjectService.deleteProject(projectId)).rejects.toThrow(
        'Cannot delete project with active members'
      );
      expect(Project.delete).not.toHaveBeenCalled();
    });

    it('should handle member count error', async () => {
      const projectId = 1;
      const existingProject = {
        id: projectId,
        name: 'Test Project',
        tenant_id: 1,
        owner_id: 1
      };
      const error = new Error('Database error');

      Project.findById.mockResolvedValue(existingProject);
      Member.countByProjectId.mockRejectedValue(error);

      await expect(ProjectService.deleteProject(projectId)).rejects.toThrow('Database error');
      expect(Project.delete).not.toHaveBeenCalled();
    });
  });

  describe('getProjectsByTenant', () => {
    it('should return projects for tenant with pagination', async () => {
      const tenantId = 1;
      const limit = 10;
      const offset = 0;
      const expectedProjects = [
        { id: 1, name: 'Project 1', tenant_id: tenantId },
        { id: 2, name: 'Project 2', tenant_id: tenantId }
      ];

      Project.findByTenantId.mockResolvedValue(expectedProjects);

      const result = await ProjectService.getProjectsByTenant(tenantId, limit, offset);

      expect(Project.findByTenantId).toHaveBeenCalledWith(tenantId, limit, offset);
      expect(result).toEqual(expectedProjects);
    });

    it('should use default pagination values', async () => {
      const tenantId = 1;
      const expectedProjects = [{ id: 1, name: 'Project 1' }];

      Project.findByTenantId.mockResolvedValue(expectedProjects);

      const result = await ProjectService.getProjectsByTenant(tenantId);

      expect(Project.findByTenantId).toHaveBeenCalledWith(tenantId, 20, 0);
      expect(result).toEqual(expectedProjects);
    });
  });

  describe('getProjectsByUser', () => {
    it('should return projects for user with pagination', async () => {
      const userId = 1;
      const limit = 10;
      const offset = 0;
      const expectedProjects = [
        { id: 1, name: 'Project 1', owner_id: userId },
        { id: 2, name: 'Project 2', owner_id: userId }
      ];

      Project.findByOwnerId.mockResolvedValue(expectedProjects);

      const result = await ProjectService.getProjectsByUser(userId, limit, offset);

      expect(Project.findByOwnerId).toHaveBeenCalledWith(userId, limit, offset);
      expect(result).toEqual(expectedProjects);
    });
  });

  describe('getProjectWithMembers', () => {
    it('should return project with members', async () => {
      const projectId = 1;
      const expectedProject = {
        id: projectId,
        name: 'Test Project',
        members: [
          { id: 1, user_id: 1, role: 'Owner' },
          { id: 2, user_id: 2, role: 'Editor' }
        ]
      };

      Project.findWithMembers.mockResolvedValue(expectedProject);

      const result = await ProjectService.getProjectWithMembers(projectId);

      expect(Project.findWithMembers).toHaveBeenCalledWith(projectId);
      expect(result).toEqual(expectedProject);
    });
  });

  describe('searchProjects', () => {
    it('should search projects by name', async () => {
      const tenantId = 1;
      const searchTerm = 'test';
      const limit = 10;
      const offset = 0;
      const allProjects = [
        { id: 1, name: 'Test Project 1' },
        { id: 2, name: 'Test Project 2' },
        { id: 3, name: 'Other Project' }
      ];
      const expectedProjects = [
        { id: 1, name: 'Test Project 1' },
        { id: 2, name: 'Test Project 2' }
      ];

      Project.findByTenantId.mockResolvedValue(allProjects);

      const result = await ProjectService.searchProjects(tenantId, searchTerm, limit, offset);

      expect(Project.findByTenantId).toHaveBeenCalledWith(tenantId, 1000, 0);
      expect(result).toEqual(expectedProjects);
    });
  });

  describe('getProjectStats', () => {
    it('should return project statistics for tenant', async () => {
      const tenantId = 1;
      const expectedStats = {
        total_projects: 5,
        tenant_id: tenantId,
        generated_at: expect.any(String)
      };

      Project.countByTenantId.mockResolvedValue(5);

      const result = await ProjectService.getProjectStats(tenantId);

      expect(Project.countByTenantId).toHaveBeenCalledWith(tenantId);
      expect(result.total_projects).toBe(expectedStats.total_projects);
      expect(result.tenant_id).toBe(expectedStats.tenant_id);
      expect(typeof result.generated_at).toBe('string');
    });
  });
});
