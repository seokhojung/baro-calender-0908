const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'baro_calendar',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

class Member {
  static async create(memberData) {
    const { tenant_id, project_id, user_id, role } = memberData;
    
    const query = `
      INSERT INTO members (tenant_id, project_id, user_id, role)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const values = [tenant_id, project_id, user_id, role];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error(`User is already a member of this project`);
      }
      throw new Error(`Failed to create member: ${error.message}`);
    }
  }

  static async findById(id) {
    const query = 'SELECT * FROM members WHERE id = $1';
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to find member: ${error.message}`);
    }
  }

  static async findByProjectId(project_id) {
    const query = `
      SELECT m.*, 
             json_build_object(
               'id', u.id,
               'email', u.email,
               'first_name', u.first_name,
               'last_name', u.last_name
             ) as user
      FROM members m
      LEFT JOIN users u ON m.user_id = u.id
      WHERE m.project_id = $1
      ORDER BY m.created_at ASC
    `;
    
    try {
      const result = await pool.query(query, [project_id]);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to find members by project: ${error.message}`);
    }
  }

  static async findByUserId(user_id) {
    const query = `
      SELECT m.*, 
             json_build_object(
               'id', p.id,
               'name', p.name,
               'color', p.color,
               'description', p.description
             ) as project
      FROM members m
      LEFT JOIN projects p ON m.project_id = p.id
      WHERE m.user_id = $1
      ORDER BY m.created_at ASC
    `;
    
    try {
      const result = await pool.query(query, [user_id]);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to find members by user: ${error.message}`);
    }
  }

  static async findByProjectAndUser(project_id, user_id) {
    const query = 'SELECT * FROM members WHERE project_id = $1 AND user_id = $2';
    
    try {
      const result = await pool.query(query, [project_id, user_id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to find member: ${error.message}`);
    }
  }

  static async updateRole(id, newRole) {
    const query = `
      UPDATE members 
      SET role = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    try {
      const result = await pool.query(query, [id, newRole]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to update member role: ${error.message}`);
    }
  }

  static async delete(id) {
    const query = 'DELETE FROM members WHERE id = $1 RETURNING *';
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to delete member: ${error.message}`);
    }
  }

  static async deleteByProjectAndUser(project_id, user_id) {
    const query = 'DELETE FROM members WHERE project_id = $1 AND user_id = $2 RETURNING *';
    
    try {
      const result = await pool.query(query, [project_id, user_id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to delete member: ${error.message}`);
    }
  }

  static async countByProjectId(project_id) {
    const query = 'SELECT COUNT(*) FROM members WHERE project_id = $1';
    
    try {
      const result = await pool.query(query, [project_id]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw new Error(`Failed to count members: ${error.message}`);
    }
  }

  static async hasRole(project_id, user_id, requiredRole) {
    const query = 'SELECT role FROM members WHERE project_id = $1 AND user_id = $2';
    
    try {
      const result = await pool.query(query, [project_id, user_id]);
      if (!result.rows[0]) return false;
      
      const userRole = result.rows[0].role;
      const roleHierarchy = {
        'Owner': 4,
        'Editor': 3,
        'Commenter': 2,
        'Viewer': 1
      };
      
      return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
    } catch (error) {
      throw new Error(`Failed to check role: ${error.message}`);
    }
  }
}

module.exports = Member;
