/**
 * Project 모델 단위 테스트
 */

const { Pool } = require('pg');
const { Project, setPool } = require('../../../src/models/project');

// Mock PostgreSQL Pool
jest.mock('pg', () => ({
  Pool: jest.fn()
}));

describe('Project Model', () => {
  let mockPool;
  let mockClient;
  let mockQuery;

  beforeEach(() => {
    // Mock query 메서드
    mockQuery = jest.fn();
    
    // Mock pool
    mockPool = {
      query: mockQuery
    };
    
    // setPool을 사용하여 모킹된 pool 주입
    setPool(mockPool);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new project successfully', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'Test description',
        color: '#FF6B6B',
        tenant_id: 1,
        owner_id: 1,
        settings: { default_view: 'month' }
      };

      const expectedProject = {
        id: 1,
        ...projectData,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockQuery.mockResolvedValueOnce({
        rows: [expectedProject]
      });

      const result = await Project.create(projectData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO projects'),
        [
          projectData.tenant_id,
          projectData.owner_id,
          projectData.name,
          projectData.color,
          projectData.description,
          JSON.stringify(projectData.settings)
        ]
      );
      expect(result).toEqual(expectedProject);
    });

    it('should handle unique constraint violations', async () => {
      const projectData = {
        name: 'Duplicate Project',
        tenant_id: 1,
        owner_id: 1
      };

      const uniqueError = new Error('duplicate key value violates unique constraint "projects_tenant_id_name_key"');
      uniqueError.code = '23505';

      mockQuery.mockRejectedValueOnce(uniqueError);

      await expect(Project.create(projectData)).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should find project by ID successfully', async () => {
      const projectId = 1;
      const expectedProject = {
        id: projectId,
        name: 'Test Project',
        tenant_id: 1,
        owner_id: 1
      };

      mockQuery.mockResolvedValueOnce({
        rows: [expectedProject]
      });

      const result = await Project.findById(projectId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM projects WHERE id = $1'),
        [projectId]
      );
      expect(result).toEqual(expectedProject);
    });

    it('should return null when project not found', async () => {
      const projectId = 999;

      mockQuery.mockResolvedValueOnce({
        rows: []
      });

      const result = await Project.findById(projectId);

      expect(result).toBeNull();
    });
  });

  describe('findByTenantId', () => {
    it('should find projects by tenant ID with pagination', async () => {
      const tenantId = 1;
      const limit = 10;
      const offset = 0;
      const expectedProjects = [
        { id: 1, name: 'Project 1', tenant_id: tenantId },
        { id: 2, name: 'Project 2', tenant_id: tenantId }
      ];

      mockQuery.mockResolvedValueOnce({
        rows: expectedProjects
      });

      const result = await Project.findByTenantId(tenantId, limit, offset);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM projects'),
        [tenantId, limit, offset]
      );
      expect(result).toEqual(expectedProjects);
    });
  });

  describe('findByOwnerId', () => {
    it('should find projects by owner ID', async () => {
      const ownerId = 1;
      const expectedProjects = [
        { id: 1, name: 'Project 1', owner_id: ownerId },
        { id: 2, name: 'Project 2', owner_id: ownerId }
      ];

      mockQuery.mockResolvedValueOnce({
        rows: expectedProjects
      });

      const result = await Project.findByOwnerId(ownerId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM projects'),
        [ownerId, 100, 0]
      );
      expect(result).toEqual(expectedProjects);
    });
  });

  describe('update', () => {
    it('should update project successfully', async () => {
      const projectId = 1;
      const updateData = {
        name: 'Updated Project',
        description: 'Updated description'
      };

      const expectedProject = {
        id: projectId,
        ...updateData,
        updated_at: new Date()
      };

      mockQuery.mockResolvedValueOnce({
        rows: [expectedProject]
      });

      const result = await Project.update(projectId, updateData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE projects'),
        expect.arrayContaining([projectId])
      );
      expect(result).toEqual(expectedProject);
    });

    it('should return null when updating non-existent project', async () => {
      const projectId = 999;
      const updateData = { name: 'Updated' };

      mockQuery.mockResolvedValueOnce({
        rows: []
      });

      const result = await Project.update(projectId, updateData);

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete project successfully', async () => {
      const projectId = 1;
      const deletedProject = {
        id: projectId,
        name: 'Deleted Project'
      };

      mockQuery.mockResolvedValueOnce({
        rows: [deletedProject]
      });

      const result = await Project.delete(projectId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM projects WHERE id = $1'),
        [projectId]
      );
      expect(result).toEqual(deletedProject);
    });
  });

  describe('countByTenantId', () => {
    it('should return project count for tenant', async () => {
      const tenantId = 1;
      const expectedCount = 5;

      mockQuery.mockResolvedValueOnce({
        rows: [{ count: expectedCount.toString() }]
      });

      const result = await Project.countByTenantId(tenantId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) FROM projects WHERE tenant_id = $1'),
        [tenantId]
      );
      expect(result).toBe(expectedCount);
    });
  });

  describe('findWithMembers', () => {
    it('should find project with members successfully', async () => {
      const projectId = 1;
      const expectedProject = {
        id: projectId,
        name: 'Test Project',
        members: [
          { id: 1, user_id: 1, role: 'Owner' },
          { id: 2, user_id: 2, role: 'Editor' }
        ]
      };

      mockQuery.mockResolvedValueOnce({
        rows: [expectedProject]
      });

      const result = await Project.findWithMembers(projectId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT p.*'),
        [projectId]
      );
      expect(result).toEqual(expectedProject);
    });
  });

  describe('searchProjects', () => {
    it('should search projects by name with pagination', async () => {
      const tenantId = 1;
      const searchTerm = 'test';
      const limit = 10;
      const offset = 0;
      const expectedProjects = [
        { id: 1, name: 'Test Project 1' },
        { id: 2, name: 'Test Project 2' }
      ];

      mockQuery.mockResolvedValueOnce({
        rows: expectedProjects
      });

      const result = await Project.searchProjects(tenantId, searchTerm, limit, offset);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM projects'),
        [tenantId, `%${searchTerm}%`, limit, offset]
      );
      expect(result).toEqual(expectedProjects);
    });
  });
});
