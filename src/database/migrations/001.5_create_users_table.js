/**
 * 사용자 테이블 생성 마이그레이션
 * 마이그레이션 ID: 001.5
 * 설명: 사용자 관리를 위한 users 테이블 생성
 */

const { Pool } = require('pg');

// 데이터베이스 연결 설정
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'baro_calendar',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

/**
 * 사용자 테이블 생성
 */
async function createUsersTable() {
  const client = await pool.connect();
  
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        tenant_id INTEGER NOT NULL,
        avatar_url TEXT,
        timezone VARCHAR(100) DEFAULT 'Asia/Seoul',
        language VARCHAR(10) DEFAULT 'ko',
        settings JSONB DEFAULT '{}',
        last_login_at TIMESTAMP,
        email_verified_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        
        CONSTRAINT fk_users_tenant
          FOREIGN KEY (tenant_id)
          REFERENCES tenants(id)
          ON DELETE CASCADE,
        
        CONSTRAINT chk_users_role
          CHECK (role IN ('admin', 'user', 'guest')),
        
        CONSTRAINT chk_users_status
          CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
        
        CONSTRAINT chk_users_email_format
          CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
      )
    `);

    // 인덱스 생성
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
      CREATE INDEX IF NOT EXISTS idx_users_tenant_role ON users(tenant_id, role);
    `);

    console.log('✅ 사용자 테이블 생성 완료');
    
  } catch (error) {
    console.error('❌ 사용자 테이블 생성 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 사용자 테이블 삭제
 */
async function dropUsersTable() {
  const client = await pool.connect();
  
  try {
    await client.query(`
      DROP TABLE IF EXISTS users CASCADE
    `);

    console.log('✅ 사용자 테이블 삭제 완료');
    
  } catch (error) {
    console.error('❌ 사용자 테이블 삭제 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 마이그레이션 실행 (업)
 */
async function up() {
  console.log('🚀 사용자 테이블 생성 마이그레이션 시작...');
  await createUsersTable();
  console.log('✅ 마이그레이션 완료');
}

/**
 * 마이그레이션 롤백 (다운)
 */
async function down() {
  console.log('🔄 사용자 테이블 생성 마이그레이션 롤백 시작...');
  await dropUsersTable();
  console.log('✅ 롤백 완료');
}

// CLI 실행 지원
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'up') {
    up().then(() => {
      console.log('✅ 마이그레이션 완료');
      process.exit(0);
    }).catch((error) => {
      console.error('❌ 마이그레이션 실패:', error);
      process.exit(1);
    });
  } else if (command === 'down') {
    down().then(() => {
      console.log('✅ 롤백 완료');
      process.exit(0);
    }).catch((error) => {
      console.error('❌ 롤백 실패:', error);
      process.exit(1);
    });
  } else {
    console.log('사용법: node 001.5_create_users_table.js [up|down]');
    process.exit(1);
  }
}

module.exports = {
  up,
  down
};
