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

class Tenant {
  static async create(tenantData) {
    const { name, domain, settings = {} } = tenantData;
    
    const query = `
      INSERT INTO tenants (name, domain, settings)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const values = [name, domain, JSON.stringify(settings)];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create tenant: ${error.message}`);
    }
  }

  static async findById(id) {
    const query = 'SELECT * FROM tenants WHERE id = $1';
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to find tenant: ${error.message}`);
    }
  }

  static async findByDomain(domain) {
    const query = 'SELECT * FROM tenants WHERE domain = $1';
    
    try {
      const result = await pool.query(query, [domain]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to find tenant by domain: ${error.message}`);
    }
  }

  static async update(id, updateData) {
    const { name, domain, settings } = updateData;
    
    const query = `
      UPDATE tenants 
      SET name = COALESCE($2, name),
          domain = COALESCE($3, domain),
          settings = COALESCE($4, settings),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const values = [id, name, domain, settings ? JSON.stringify(settings) : null];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to update tenant: ${error.message}`);
    }
  }

  static async delete(id) {
    const query = 'DELETE FROM tenants WHERE id = $1 RETURNING *';
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to delete tenant: ${error.message}`);
    }
  }

  static async list(limit = 100, offset = 0) {
    const query = `
      SELECT * FROM tenants 
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `;
    
    try {
      const result = await pool.query(query, [limit, offset]);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to list tenants: ${error.message}`);
    }
  }

  static async count() {
    const query = 'SELECT COUNT(*) FROM tenants';
    
    try {
      const result = await pool.query(query);
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw new Error(`Failed to count tenants: ${error.message}`);
    }
  }
}

module.exports = {
  Tenant,
  setPool
};
