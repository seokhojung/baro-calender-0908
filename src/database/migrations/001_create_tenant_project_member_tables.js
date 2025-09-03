// 환경 변수 로딩
require('dotenv').config();

const { Pool } = require('pg');
const SafeMigrationManager = require('../safe-migration');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'baro_calendar',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// 마이그레이션 스크립트가 기대하는 형식
async function up() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // 1. 테넌트 테이블 생성
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        domain VARCHAR(255) UNIQUE,
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. 프로젝트 테이블 생성
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        owner_id INTEGER NOT NULL,
        name VARCHAR(100) NOT NULL,
        color VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
        description TEXT,
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(tenant_id, name)
      );
    `);

    // 3. 멤버 테이블 생성
    await client.query(`
      CREATE TABLE IF NOT EXISTS members (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('Owner', 'Editor', 'Commenter', 'Viewer')),
        invited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        accepted_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(project_id, user_id)
      );
    `);

    // 4. 인덱스 생성
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_projects_tenant_id ON projects(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
      CREATE INDEX IF NOT EXISTS idx_members_tenant_id ON members(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_members_project_id ON members(project_id);
      CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);
      CREATE INDEX IF NOT EXISTS idx_members_role ON members(role);
    `);

    // 5. 기본 테넌트 데이터 삽입
    await client.query(`
      INSERT INTO tenants (id, name, domain, settings) 
      VALUES (1, 'Default Tenant', 'default.localhost', '{"timezone": "Asia/Seoul"}')
      ON CONFLICT (id) DO NOTHING;
    `);

    await client.query('COMMIT');
    console.log('✅ Database tables created successfully');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

// ⚠️ 위험한 rollback 함수를 안전한 버전으로 교체
async function rollback() {
  console.log('🚨 DANGEROUS OPERATION: This would DELETE ALL DATA!');
  console.log('📋 Safe alternatives:');
  console.log('   - Use: npm run migrate:safe-rollback 001_create_tenant_project_member_tables');
  console.log('   - Or: npm run migrate:restore-backup [backup-file]');
  console.log('   - Emergency: npm run migrate:emergency-rollback (requires confirmation)');
  
  if (process.env.ALLOW_DESTRUCTIVE_ROLLBACK !== 'true') {
    throw new Error('Destructive rollback blocked for safety. Use safe-migration.js instead.');
  }
  
  // 만약 정말로 실행해야 한다면 (개발 환경에서만)
  if (process.env.NODE_ENV === 'production') {
    throw new Error('BLOCKED: Cannot run destructive rollback in production!');
  }
  
  console.log('⚠️ Proceeding with destructive rollback in development environment...');
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 데이터가 있는지 먼저 확인
    const memberCount = await client.query('SELECT COUNT(*) FROM members WHERE id IS NOT NULL');
    const projectCount = await client.query('SELECT COUNT(*) FROM projects WHERE id IS NOT NULL');
    const tenantCount = await client.query('SELECT COUNT(*) FROM tenants WHERE id IS NOT NULL');
    
    console.log(`📊 Data to be deleted:`);
    console.log(`   - Members: ${memberCount.rows[0].count}`);
    console.log(`   - Projects: ${projectCount.rows[0].count}`);
    console.log(`   - Tenants: ${tenantCount.rows[0].count}`);
    
    if (memberCount.rows[0].count > 0 || projectCount.rows[0].count > 0) {
      throw new Error('Cannot rollback: Tables contain user data! Use safe rollback instead.');
    }
    
    await client.query('DROP TABLE IF EXISTS members CASCADE');
    await client.query('DROP TABLE IF EXISTS projects CASCADE');
    await client.query('DROP TABLE IF EXISTS tenants CASCADE');
    
    await client.query('COMMIT');
    console.log('✅ Database tables rolled back successfully');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error rolling back tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

// CLI 실행 지원
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'up') {
    up()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else if (command === 'down') {
    rollback()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    console.log('Usage: node 001_create_tenant_project_member_tables.js [up|down]');
    process.exit(1);
  }
}

module.exports = { up, rollback };
