/**
 * Tenant 모델 단위 테스트
 */

const { Pool } = require('pg');
const { Tenant, setPool } = require('../../../src/models/tenant');

// Mock PostgreSQL Pool
jest.mock('pg', () => ({
  Pool: jest.fn()
}));

describe('Tenant Model', () => {
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
    it('should create a new tenant successfully', async () => {
      const tenantData = {
        name: 'Test Company',
        domain: 'test.com',
        settings: { timezone: 'UTC' },
        status: 'active'
      };

      const expectedTenant = {
        id: 1,
        ...tenantData,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockQuery.mockResolvedValueOnce({
        rows: [expectedTenant]
      });

      const result = await Tenant.create(tenantData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO tenants'),
        [tenantData.name, tenantData.domain, JSON.stringify(tenantData.settings)]
      );
      expect(result).toEqual(expectedTenant);
    });

    it('should handle database errors', async () => {
      const tenantData = { name: 'Test', domain: 'test.com' };
      const dbError = new Error('Database connection failed');

      mockQuery.mockRejectedValueOnce(dbError);

      await expect(Tenant.create(tenantData)).rejects.toThrow('Database connection failed');
    });
  });

  describe('findById', () => {
    it('should find tenant by ID successfully', async () => {
      const tenantId = 1;
      const expectedTenant = {
        id: tenantId,
        name: 'Test Company',
        domain: 'test.com'
      };

      mockQuery.mockResolvedValueOnce({
        rows: [expectedTenant]
      });

      const result = await Tenant.findById(tenantId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM tenants WHERE id = $1'),
        [tenantId]
      );
      expect(result).toEqual(expectedTenant);
    });

    it('should return null when tenant not found', async () => {
      const tenantId = 999;

      mockQuery.mockResolvedValueOnce({
        rows: []
      });

      const result = await Tenant.findById(tenantId);

      expect(result).toBeNull();
    });
  });

  describe('findByDomain', () => {
    it('should find tenant by domain successfully', async () => {
      const domain = 'test.com';
      const expectedTenant = {
        id: 1,
        name: 'Test Company',
        domain: domain
      };

      mockQuery.mockResolvedValueOnce({
        rows: [expectedTenant]
      });

      const result = await Tenant.findByDomain(domain);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM tenants WHERE domain = $1'),
        [domain]
      );
      expect(result).toEqual(expectedTenant);
    });
  });

  describe('update', () => {
    it('should update tenant successfully', async () => {
      const tenantId = 1;
      const updateData = {
        name: 'Updated Company',
        settings: { timezone: 'Asia/Seoul' }
      };

      const expectedTenant = {
        id: tenantId,
        ...updateData,
        updated_at: new Date()
      };

      mockQuery.mockResolvedValueOnce({
        rows: [expectedTenant]
      });

      const result = await Tenant.update(tenantId, updateData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE tenants'),
        expect.arrayContaining([tenantId])
      );
      expect(result).toEqual(expectedTenant);
    });

    it('should return null when updating non-existent tenant', async () => {
      const tenantId = 999;
      const updateData = { name: 'Updated' };

      mockQuery.mockResolvedValueOnce({
        rows: []
      });

      const result = await Tenant.update(tenantId, updateData);

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete tenant successfully', async () => {
      const tenantId = 1;
      const deletedTenant = {
        id: tenantId,
        name: 'Deleted Company'
      };

      mockQuery.mockResolvedValueOnce({
        rows: [deletedTenant]
      });

      const result = await Tenant.delete(tenantId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM tenants WHERE id = $1'),
        [tenantId]
      );
      expect(result).toEqual(deletedTenant);
    });
  });

  describe('list', () => {
    it('should list tenants with pagination', async () => {
      const limit = 10;
      const offset = 0;
      const expectedTenants = [
        { id: 1, name: 'Company 1' },
        { id: 2, name: 'Company 2' }
      ];

      mockQuery.mockResolvedValueOnce({
        rows: expectedTenants
      });

      const result = await Tenant.list(limit, offset);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM tenants'),
        [limit, offset]
      );
      expect(result).toEqual(expectedTenants);
    });

    it('should use default pagination values', async () => {
      const expectedTenants = [{ id: 1, name: 'Company 1' }];

      mockQuery.mockResolvedValueOnce({
        rows: expectedTenants
      });

      const result = await Tenant.list();

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT'),
        [100, 0] // 기본값: limit=100, offset=0
      );
      expect(result).toEqual(expectedTenants);
    });
  });

  describe('count', () => {
    it('should return total tenant count', async () => {
      const expectedCount = 5;

      mockQuery.mockResolvedValueOnce({
        rows: [{ count: expectedCount.toString() }]
      });

      const result = await Tenant.count();

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) FROM tenants')
      );
      expect(result).toBe(expectedCount);
    });
  });
});
