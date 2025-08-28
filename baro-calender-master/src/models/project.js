const { Pool } = require('pg');

// 테스트 환경에서 모킹할 수 있도록 pool을 변수로 분리
let pool;

// 테스트 환경에서 pool을 주입할 수 있는 메서드
function setPool(newPool) {
  pool = newPool;
}

// 기본 pool 생성
if (!pool) {
  pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'baro_calendar',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
  });
}

class Project {
  static async create(projectData) {
    const { tenant_id, owner_id, name, color, description, settings = {} } = projectData;
    
    const query = `
      INSERT INTO projects (tenant_id, owner_id, name, color, description, settings)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [tenant_id, owner_id, name, color, description, JSON.stringify(settings)];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error(`Project with name '${name}' already exists in this tenant`);
      }
      throw new Error(`Failed to create project: ${error.message}`);
    }
  }

  static async findById(id) {
    const query = 'SELECT * FROM projects WHERE id = $1';
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to find project: ${error.message}`);
    }
  }

  static async findByTenantId(tenant_id, limit = 100, offset = 0) {
    const query = `
      SELECT * FROM projects 
      WHERE tenant_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;
    
    try {
      const result = await pool.query(query, [tenant_id, limit, offset]);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to find projects by tenant: ${error.message}`);
    }
  }

  static async findByOwnerId(owner_id, limit = 100, offset = 0) {
    const query = `
      SELECT * FROM projects 
      WHERE owner_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;
    
    try {
      const result = await pool.query(query, [owner_id, limit, offset]);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to find projects by owner: ${error.message}`);
    }
  }

  static async update(id, updateData) {
    const { name, color, description, settings } = updateData;
    
    const query = `
      UPDATE projects 
      SET name = COALESCE($2, name),
          color = COALESCE($3, color),
          description = COALESCE($4, description),
          settings = COALESCE($5, settings),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const values = [id, name, color, description, settings ? JSON.stringify(settings) : null];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error(`Project with name '${name}' already exists in this tenant`);
      }
      throw new Error(`Failed to update project: ${error.message}`);
    }
  }

  static async delete(id) {
    const query = 'DELETE FROM projects WHERE id = $1 RETURNING *';
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to delete project: ${error.message}`);
    }
  }

  static async countByTenantId(tenant_id) {
    const query = 'SELECT COUNT(*) FROM projects WHERE tenant_id = $1';
    
    try {
      const result = await pool.query(query, [tenant_id]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw new Error(`Failed to count projects: ${error.message}`);
    }
  }

  static async findWithMembers(id) {
    const query = `
      SELECT p.*, 
             json_agg(
               json_build_object(
                 'id', m.id,
                 'user_id', m.user_id,
                 'role', m.role,
                 'invited_at', m.invited_at,
                 'accepted_at', m.accepted_at
               )
             ) as members
      FROM projects p
      LEFT JOIN members m ON p.id = m.project_id
      WHERE p.id = $1
      GROUP BY p.id
    `;
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to find project with members: ${error.message}`);
    }
  }

  static async searchProjects(tenant_id, searchTerm, limit = 100, offset = 0) {
    const query = `
      SELECT * FROM projects 
      WHERE tenant_id = $1 AND name ILIKE $2
      ORDER BY created_at DESC 
      LIMIT $3 OFFSET $4
    `;
    
    try {
      const result = await pool.query(query, [tenant_id, `%${searchTerm}%`, limit, offset]);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to search projects: ${error.message}`);
    }
  }
}

module.exports = {
  Project,
  setPool
};
