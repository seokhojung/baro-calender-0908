/**
 * 데이터베이스 마이그레이션 실행 스크립트
 * 모든 마이그레이션을 순서대로 실행
 */

// 환경 변수 로딩
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// 데이터베이스 연결 설정
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'baro_calendar',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// 마이그레이션 테이블 생성
async function createMigrationsTable() {
  const client = await pool.connect();
  
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    console.log('✅ 마이그레이션 테이블 생성 완료');
  } catch (error) {
    console.error('❌ 마이그레이션 테이블 생성 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 마이그레이션 실행 여부 확인
async function isMigrationExecuted(name) {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      'SELECT COUNT(*) FROM migrations WHERE name = $1',
      [name]
    );
    
    return parseInt(result.rows[0].count) > 0;
  } catch (error) {
    console.error('❌ 마이그레이션 실행 여부 확인 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 마이그레이션 실행 기록
async function recordMigration(name) {
  const client = await pool.connect();
  
  try {
    await client.query(
      'INSERT INTO migrations (name) VALUES ($1)',
      [name]
    );
    
    console.log(`✅ 마이그레이션 기록 완료: ${name}`);
  } catch (error) {
    console.error('❌ 마이그레이션 기록 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 마이그레이션 실행
async function runMigration(migrationPath) {
  try {
    const migration = require(migrationPath);
    
    if (typeof migration.up === 'function') {
      await migration.up();
      return true;
    } else {
      console.error(`❌ 마이그레이션 파일에 up 함수가 없습니다: ${migrationPath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ 마이그레이션 실행 실패: ${migrationPath}`, error);
    return false;
  }
}

// 모든 마이그레이션 실행
async function runAllMigrations() {
  console.log('🚀 데이터베이스 마이그레이션 시작...');
  
  try {
    // 마이그레이션 테이블 생성
    await createMigrationsTable();
    
    // 마이그레이션 파일 목록 (순서대로)
    const migrations = [
      '001_create_tenant_project_member_tables.js',
      '001.5_create_users_table.js',
      '002_insert_default_tenant_and_projects.js'
    ];
    
    const migrationsDir = path.join(__dirname, 'migrations');
    
    for (const migrationFile of migrations) {
      const migrationPath = path.join(migrationsDir, migrationFile);
      const migrationName = path.basename(migrationFile, '.js');
      
      // 파일 존재 여부 확인
      if (!fs.existsSync(migrationPath)) {
        console.log(`⚠️  마이그레이션 파일을 찾을 수 없습니다: ${migrationFile}`);
        continue;
      }
      
      // 이미 실행된 마이그레이션인지 확인
      if (await isMigrationExecuted(migrationName)) {
        console.log(`⏭️  이미 실행된 마이그레이션: ${migrationName}`);
        continue;
      }
      
      console.log(`🔄 마이그레이션 실행 중: ${migrationName}`);
      
      // 마이그레이션 실행
      const success = await runMigration(migrationPath);
      
      if (success) {
        // 실행 기록
        await recordMigration(migrationName);
        console.log(`✅ 마이그레이션 완료: ${migrationName}`);
      } else {
        console.error(`❌ 마이그레이션 실패: ${migrationName}`);
        throw new Error(`마이그레이션 실패: ${migrationName}`);
      }
    }
    
    console.log('🎉 모든 마이그레이션이 성공적으로 완료되었습니다!');
    
  } catch (error) {
    console.error('❌ 마이그레이션 실행 중 오류 발생:', error);
    throw error;
  }
}

// 마이그레이션 상태 확인
async function showMigrationStatus() {
  console.log('📊 마이그레이션 상태 확인 중...');
  
  try {
    const client = await pool.connect();
    
    // 마이그레이션 테이블이 존재하는지 확인
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'migrations'
      )
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('❌ 마이그레이션 테이블이 존재하지 않습니다');
      return;
    }
    
    // 실행된 마이그레이션 목록
    const result = await client.query(`
      SELECT name, executed_at 
      FROM migrations 
      ORDER BY executed_at
    `);
    
    if (result.rows.length === 0) {
      console.log('📝 실행된 마이그레이션이 없습니다');
    } else {
      console.log('✅ 실행된 마이그레이션 목록:');
      result.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.name} (${row.executed_at})`);
      });
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ 마이그레이션 상태 확인 실패:', error);
  }
}

// 메인 실행
async function main() {
  const command = process.argv[2];
  
  try {
    if (command === 'status') {
      await showMigrationStatus();
    } else if (command === 'run') {
      await runAllMigrations();
    } else {
      console.log('사용법:');
      console.log('  node run-migrations.js run    - 모든 마이그레이션 실행');
      console.log('  node run-migrations.js status - 마이그레이션 상태 확인');
    }
  } catch (error) {
    console.error('❌ 스크립트 실행 실패:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// CLI 실행 지원
if (require.main === module) {
  main();
}

module.exports = {
  runAllMigrations,
  showMigrationStatus
};
