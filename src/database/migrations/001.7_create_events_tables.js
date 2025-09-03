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

// 마이그레이션: Events 관련 테이블 생성
async function up() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    console.log('Creating events table...');
    // 1. events 테이블 생성
    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        location VARCHAR(255),
        starts_at_utc TIMESTAMP WITH TIME ZONE NOT NULL,
        ends_at_utc TIMESTAMP WITH TIME ZONE NOT NULL,
        timezone VARCHAR(100) DEFAULT 'Asia/Seoul',
        is_all_day BOOLEAN DEFAULT FALSE,
        color VARCHAR(7),
        rrule_json TEXT, -- 반복 규칙 (RFC 5545 RRULE 형식)
        exdates_json TEXT, -- 제외 날짜들 (JSON 배열)
        status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'tentative', 'cancelled')),
        visibility VARCHAR(20) DEFAULT 'default' CHECK (visibility IN ('default', 'public', 'private', 'confidential')),
        created_by INTEGER NOT NULL REFERENCES users(id),
        updated_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT events_end_after_start CHECK (ends_at_utc >= starts_at_utc)
      );
    `);

    console.log('Creating event_occurrences table...');
    // 2. event_occurrences 테이블 (반복 일정 전개용)
    await client.query(`
      CREATE TABLE IF NOT EXISTS event_occurrences (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        occurrence_start_utc TIMESTAMP WITH TIME ZONE NOT NULL,
        occurrence_end_utc TIMESTAMP WITH TIME ZONE NOT NULL,
        is_exception BOOLEAN DEFAULT FALSE,
        exception_data JSONB, -- 예외 발생 시 변경된 데이터
        window_from_utc TIMESTAMP WITH TIME ZONE NOT NULL,
        window_to_utc TIMESTAMP WITH TIME ZONE NOT NULL,
        generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT occurrences_end_after_start CHECK (occurrence_end_utc >= occurrence_start_utc)
      );
    `);

    console.log('Creating event_tags table...');
    // 3. event_tags 테이블 (태그 필터링용)
    await client.query(`
      CREATE TABLE IF NOT EXISTS event_tags (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        tag_name VARCHAR(50) NOT NULL,
        tag_color VARCHAR(7),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_event_tag UNIQUE(event_id, tag_name)
      );
    `);

    console.log('Creating event_attachments table...');
    // 4. event_attachments 테이블 (파일 첨부용)
    await client.query(`
      CREATE TABLE IF NOT EXISTS event_attachments (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INTEGER,
        mime_type VARCHAR(100),
        uploaded_by INTEGER NOT NULL REFERENCES users(id),
        uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Creating event_reminders table...');
    // 5. event_reminders 테이블 (알림 설정용)
    await client.query(`
      CREATE TABLE IF NOT EXISTS event_reminders (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        minutes_before INTEGER NOT NULL,
        method VARCHAR(20) DEFAULT 'email' CHECK (method IN ('email', 'popup', 'push')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_user_event_reminder UNIQUE(event_id, user_id, minutes_before, method)
      );
    `);

    console.log('Creating share_links table...');
    // 6. share_links 테이블 (공유 링크용)
    await client.query(`
      CREATE TABLE IF NOT EXISTS share_links (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL UNIQUE,
        permission_level VARCHAR(20) NOT NULL CHECK (permission_level IN ('view', 'comment', 'edit')),
        expires_at TIMESTAMP WITH TIME ZONE,
        max_uses INTEGER,
        current_uses INTEGER DEFAULT 0,
        created_by INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_used_at TIMESTAMP WITH TIME ZONE,
        is_active BOOLEAN DEFAULT TRUE
      );
    `);

    console.log('Creating indexes...');
    // 7. 인덱스 생성 (성능 최적화)
    await client.query(`
      -- Events 인덱스
      CREATE INDEX IF NOT EXISTS idx_events_tenant_project ON events(tenant_id, project_id);
      CREATE INDEX IF NOT EXISTS idx_events_starts_at ON events(starts_at_utc);
      CREATE INDEX IF NOT EXISTS idx_events_ends_at ON events(ends_at_utc);
      CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
      CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
      
      -- Event Occurrences 인덱스
      CREATE INDEX IF NOT EXISTS idx_occurrences_tenant_event ON event_occurrences(tenant_id, event_id);
      CREATE INDEX IF NOT EXISTS idx_occurrences_project_start ON event_occurrences(project_id, occurrence_start_utc);
      CREATE INDEX IF NOT EXISTS idx_occurrences_window ON event_occurrences(window_from_utc, window_to_utc);
      
      -- Event Tags 인덱스
      CREATE INDEX IF NOT EXISTS idx_event_tags_event ON event_tags(event_id);
      CREATE INDEX IF NOT EXISTS idx_event_tags_name ON event_tags(tag_name);
      
      -- Event Attachments 인덱스
      CREATE INDEX IF NOT EXISTS idx_attachments_event ON event_attachments(event_id);
      
      -- Event Reminders 인덱스
      CREATE INDEX IF NOT EXISTS idx_reminders_event ON event_reminders(event_id);
      CREATE INDEX IF NOT EXISTS idx_reminders_user ON event_reminders(user_id);
      
      -- Share Links 인덱스
      CREATE INDEX IF NOT EXISTS idx_share_links_token ON share_links(token);
      CREATE INDEX IF NOT EXISTS idx_share_links_project ON share_links(project_id);
    `);

    await client.query('COMMIT');
    console.log('✅ Events tables created successfully');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating events tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 안전한 롤백 함수 (데이터 보호)
async function rollback() {
  console.log('🚨 CRITICAL: This would DELETE ALL EVENTS DATA!');
  console.log('📊 This affects:');
  console.log('   - All user events and schedules');
  console.log('   - Event attachments and files');
  console.log('   - Recurring event patterns');
  console.log('   - Share links and collaborations');
  console.log('');
  console.log('🛡️ Safe alternatives:');
  console.log('   - Use: npm run migrate:safe-rollback 001.7_create_events_tables');
  console.log('   - Or: npm run migrate:restore-backup [backup-file]');
  console.log('   - Emergency only: ALLOW_DESTRUCTIVE_ROLLBACK=true npm run migrate');
  
  if (process.env.ALLOW_DESTRUCTIVE_ROLLBACK !== 'true') {
    throw new Error('🛡️ Events rollback blocked for data safety. Use SafeMigrationManager.');
  }
  
  if (process.env.NODE_ENV === 'production') {
    throw new Error('❌ BLOCKED: Cannot delete events in production!');
  }
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 데이터 존재 여부 확인
    const eventCount = await client.query('SELECT COUNT(*) FROM events');
    const attachmentCount = await client.query('SELECT COUNT(*) FROM event_attachments');
    const tagCount = await client.query('SELECT COUNT(*) FROM event_tags');
    
    console.log('📊 Data that will be PERMANENTLY DELETED:');
    console.log(`   - Events: ${eventCount.rows[0].count}`);
    console.log(`   - Attachments: ${attachmentCount.rows[0].count}`);
    console.log(`   - Tags: ${tagCount.rows[0].count}`);
    
    // 데이터가 있으면 롤백 차단
    if (eventCount.rows[0].count > 0) {
      throw new Error('🛡️ Cannot rollback: Events table contains user data! Create backup first.');
    }
    
    console.log('⚠️ Proceeding with destructive rollback...');
    
    await client.query('DROP TABLE IF EXISTS event_reminders CASCADE');
    await client.query('DROP TABLE IF EXISTS event_attachments CASCADE');
    await client.query('DROP TABLE IF EXISTS event_tags CASCADE');
    await client.query('DROP TABLE IF EXISTS event_occurrences CASCADE');
    await client.query('DROP TABLE IF EXISTS share_links CASCADE');
    await client.query('DROP TABLE IF EXISTS events CASCADE');
    
    await client.query('COMMIT');
    console.log('✅ Events tables dropped successfully');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error dropping events tables:', error);
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
    console.log('Usage: node 001.7_create_events_tables.js [up|down]');
    process.exit(1);
  }
}

module.exports = { up, rollback };