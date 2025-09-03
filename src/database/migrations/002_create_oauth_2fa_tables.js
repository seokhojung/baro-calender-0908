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

// OAuth + 2FA 테이블 생성
async function up() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    console.log('Creating OAuth providers table...');
    // 1. oauth_providers 테이블 (Google, GitHub 등)
    await client.query(`
      CREATE TABLE IF NOT EXISTS oauth_providers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider VARCHAR(50) NOT NULL CHECK (provider IN ('google', 'github', 'microsoft', 'facebook')),
        provider_user_id VARCHAR(255) NOT NULL,
        provider_email VARCHAR(255),
        provider_name VARCHAR(255),
        provider_avatar VARCHAR(500),
        access_token TEXT,
        refresh_token TEXT,
        expires_at TIMESTAMP WITH TIME ZONE,
        scope TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_provider_user UNIQUE(provider, provider_user_id),
        CONSTRAINT unique_user_provider UNIQUE(user_id, provider)
      );
    `);

    console.log('Creating 2FA secrets table...');
    // 2. two_factor_auth 테이블 (TOTP 설정)
    await client.query(`
      CREATE TABLE IF NOT EXISTS two_factor_auth (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        method VARCHAR(20) NOT NULL CHECK (method IN ('totp', 'sms', 'email')),
        secret VARCHAR(255) NOT NULL,
        backup_codes TEXT[], -- 복구 코드들 (JSON 배열)
        is_verified BOOLEAN DEFAULT FALSE,
        is_enabled BOOLEAN DEFAULT FALSE,
        phone_number VARCHAR(20), -- SMS용
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        verified_at TIMESTAMP WITH TIME ZONE,
        last_used_at TIMESTAMP WITH TIME ZONE,
        CONSTRAINT unique_user_method UNIQUE(user_id, method)
      );
    `);

    console.log('Creating authentication logs table...');
    // 3. auth_logs 테이블 (보안 감사용)
    await client.query(`
      CREATE TABLE IF NOT EXISTS auth_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        email VARCHAR(255),
        event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
          'login_success', 'login_failed', 'logout', 'password_reset', 
          'oauth_login', '2fa_enabled', '2fa_disabled', '2fa_success', '2fa_failed',
          'account_locked', 'account_unlocked', 'suspicious_activity'
        )),
        provider VARCHAR(50), -- oauth provider if applicable
        ip_address INET,
        user_agent TEXT,
        location JSONB, -- {country, city, timezone}
        metadata JSONB, -- 추가 컨텍스트 데이터
        risk_score INTEGER DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Creating user sessions table...');
    // 4. user_sessions 테이블 (세션 관리)
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        session_id VARCHAR(255) NOT NULL UNIQUE,
        jwt_token_id VARCHAR(255), -- JWT jti claim
        device_info JSONB, -- {device, browser, os}
        ip_address INET,
        location JSONB,
        is_active BOOLEAN DEFAULT TRUE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Updating users table for OAuth + 2FA...');
    // 5. users 테이블에 OAuth + 2FA 관련 컬럼 추가
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS oauth_only BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255),
      ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE
    `);

    console.log('Creating indexes...');
    // 6. 성능 최적화 인덱스
    await client.query(`
      -- OAuth Providers 인덱스
      CREATE INDEX IF NOT EXISTS idx_oauth_providers_user ON oauth_providers(user_id);
      CREATE INDEX IF NOT EXISTS idx_oauth_providers_provider_id ON oauth_providers(provider, provider_user_id);
      
      -- 2FA 인덱스
      CREATE INDEX IF NOT EXISTS idx_2fa_user_enabled ON two_factor_auth(user_id, is_enabled);
      CREATE INDEX IF NOT EXISTS idx_2fa_method ON two_factor_auth(method);
      
      -- Auth Logs 인덱스
      CREATE INDEX IF NOT EXISTS idx_auth_logs_user_created ON auth_logs(user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_auth_logs_event_type ON auth_logs(event_type);
      CREATE INDEX IF NOT EXISTS idx_auth_logs_ip ON auth_logs(ip_address);
      CREATE INDEX IF NOT EXISTS idx_auth_logs_created ON auth_logs(created_at DESC);
      
      -- Sessions 인덱스
      CREATE INDEX IF NOT EXISTS idx_sessions_user_active ON user_sessions(user_id, is_active);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);
      CREATE INDEX IF NOT EXISTS idx_sessions_token_id ON user_sessions(jwt_token_id);
      
      -- Users 보안 인덱스
      CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email, email_verified);
      CREATE INDEX IF NOT EXISTS idx_users_locked ON users(account_locked_until);
    `);

    console.log('Creating security functions...');
    // 7. 보안 관련 PostgreSQL 함수들
    await client.query(`
      -- 로그인 실패 횟수 증가 함수
      CREATE OR REPLACE FUNCTION increment_failed_login_attempts(user_email VARCHAR)
      RETURNS INTEGER AS $$
      DECLARE
        attempt_count INTEGER;
      BEGIN
        UPDATE users 
        SET failed_login_attempts = failed_login_attempts + 1,
            account_locked_until = CASE 
              WHEN failed_login_attempts + 1 >= 5 THEN NOW() + INTERVAL '15 minutes'
              ELSE account_locked_until
            END
        WHERE email = user_email
        RETURNING failed_login_attempts INTO attempt_count;
        
        RETURN COALESCE(attempt_count, 0);
      END;
      $$ LANGUAGE plpgsql;
      
      -- 로그인 성공 시 초기화 함수
      CREATE OR REPLACE FUNCTION reset_failed_login_attempts(user_email VARCHAR)
      RETURNS VOID AS $$
      BEGIN
        UPDATE users 
        SET failed_login_attempts = 0,
            account_locked_until = NULL,
            last_login_at = NOW()
        WHERE email = user_email;
      END;
      $$ LANGUAGE plpgsql;
      
      -- 세션 정리 함수
      CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
      RETURNS INTEGER AS $$
      DECLARE
        deleted_count INTEGER;
      BEGIN
        DELETE FROM user_sessions 
        WHERE expires_at < NOW() OR is_active = FALSE;
        
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RETURN deleted_count;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query('COMMIT');
    console.log('✅ OAuth + 2FA tables created successfully');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating OAuth + 2FA tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 안전한 롤백 함수
async function rollback() {
  console.log('🚨 CRITICAL: This would DELETE ALL AUTHENTICATION DATA!');
  console.log('📊 This affects:');
  console.log('   - All OAuth provider connections');
  console.log('   - All 2FA configurations');
  console.log('   - Authentication logs and sessions');
  console.log('   - User security settings');
  console.log('');
  console.log('🛡️ Safe alternatives:');
  console.log('   - Use: npm run migrate:safe-rollback 002_create_oauth_2fa_tables');
  console.log('   - Or: npm run migrate:restore-backup [backup-file]');
  console.log('   - Emergency only: ALLOW_DESTRUCTIVE_ROLLBACK=true npm run migrate');
  
  if (process.env.ALLOW_DESTRUCTIVE_ROLLBACK !== 'true') {
    throw new Error('🛡️ OAuth rollback blocked for security. Use SafeMigrationManager.');
  }
  
  if (process.env.NODE_ENV === 'production') {
    throw new Error('❌ BLOCKED: Cannot delete authentication data in production!');
  }
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 데이터 존재 여부 확인
    const oauthCount = await client.query('SELECT COUNT(*) FROM oauth_providers');
    const tfaCount = await client.query('SELECT COUNT(*) FROM two_factor_auth');
    const sessionCount = await client.query('SELECT COUNT(*) FROM user_sessions');
    
    console.log('📊 Authentication data that will be PERMANENTLY DELETED:');
    console.log(`   - OAuth Connections: ${oauthCount.rows[0].count}`);
    console.log(`   - 2FA Setups: ${tfaCount.rows[0].count}`);
    console.log(`   - Active Sessions: ${sessionCount.rows[0].count}`);
    
    if (oauthCount.rows[0].count > 0 || tfaCount.rows[0].count > 0) {
      throw new Error('🛡️ Cannot rollback: Authentication tables contain user data!');
    }
    
    console.log('⚠️ Proceeding with destructive rollback...');
    
    // 함수 삭제
    await client.query('DROP FUNCTION IF EXISTS increment_failed_login_attempts(VARCHAR)');
    await client.query('DROP FUNCTION IF EXISTS reset_failed_login_attempts(VARCHAR)');
    await client.query('DROP FUNCTION IF EXISTS cleanup_expired_sessions()');
    
    // 테이블 삭제
    await client.query('DROP TABLE IF EXISTS user_sessions CASCADE');
    await client.query('DROP TABLE IF EXISTS auth_logs CASCADE');
    await client.query('DROP TABLE IF EXISTS two_factor_auth CASCADE');
    await client.query('DROP TABLE IF EXISTS oauth_providers CASCADE');
    
    // users 테이블 컬럼 제거
    await client.query(`
      ALTER TABLE users 
      DROP COLUMN IF EXISTS oauth_only,
      DROP COLUMN IF EXISTS two_factor_enabled,
      DROP COLUMN IF EXISTS account_locked_until,
      DROP COLUMN IF EXISTS failed_login_attempts,
      DROP COLUMN IF EXISTS password_changed_at,
      DROP COLUMN IF EXISTS last_login_at,
      DROP COLUMN IF EXISTS email_verified,
      DROP COLUMN IF EXISTS email_verification_token,
      DROP COLUMN IF EXISTS email_verified_at
    `);
    
    await client.query('COMMIT');
    console.log('✅ OAuth + 2FA tables rolled back successfully');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error rolling back OAuth + 2FA tables:', error);
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
    console.log('Usage: node 002_create_oauth_2fa_tables.js [up|down]');
    process.exit(1);
  }
}

module.exports = { up, rollback };