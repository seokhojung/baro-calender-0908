const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// 안전한 마이그레이션 관리 시스템
class SafeMigrationManager {
  constructor() {
    this.pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'baro_calendar',
      password: process.env.DB_PASSWORD || 'password',
      port: process.env.DB_PORT || 5432,
    });
    
    this.backupPath = process.env.BACKUP_PATH || './backups';
    this.isDryRun = process.env.MIGRATION_DRY_RUN === 'true';
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  // 1. 마이그레이션 실행 전 필수 백업
  async createBackup(migrationName) {
    if (!fs.existsSync(this.backupPath)) {
      fs.mkdirSync(this.backupPath, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(this.backupPath, `backup_${migrationName}_${timestamp}.sql`);
    
    console.log(`🔄 Creating backup before migration: ${migrationName}`);
    
    try {
      // PostgreSQL dump command
      const { exec } = require('child_process');
      const dumpCommand = `pg_dump -h ${process.env.DB_HOST || 'localhost'} -U ${process.env.DB_USER || 'postgres'} -d ${process.env.DB_NAME || 'baro_calendar'} > "${backupFile}"`;
      
      await new Promise((resolve, reject) => {
        exec(dumpCommand, (error, stdout, stderr) => {
          if (error) {
            console.error(`❌ Backup failed: ${error}`);
            reject(error);
          } else {
            console.log(`✅ Backup created: ${backupFile}`);
            resolve(stdout);
          }
        });
      });
      
      return backupFile;
    } catch (error) {
      throw new Error(`Failed to create backup: ${error.message}`);
    }
  }

  // 2. Dry Run - 실제 실행 없이 검증
  async dryRunMigration(migrationFunction, migrationName) {
    console.log(`🧪 DRY RUN: Testing migration ${migrationName}`);
    
    const client = await this.pool.connect();
    
    try {
      // 트랜잭션 시작하되 커밋하지 않음
      await client.query('BEGIN');
      
      // 실제 마이그레이션 함수 실행
      await migrationFunction(client, true); // true = dry run mode
      
      // 롤백하여 실제로는 적용하지 않음
      await client.query('ROLLBACK');
      
      console.log('✅ DRY RUN: Migration validation successful');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`❌ DRY RUN FAILED: ${error.message}`);
      throw new Error(`Migration validation failed: ${error.message}`);
    } finally {
      client.release();
    }
  }

  // 3. 안전한 마이그레이션 실행
  async runMigrationSafely(migrationFunction, migrationName, options = {}) {
    console.log(`\n🚀 Starting safe migration: ${migrationName}`);
    
    // Production 환경에서 추가 확인
    if (this.isProduction) {
      console.log('⚠️  PRODUCTION ENVIRONMENT DETECTED');
      console.log('📋 Pre-migration checklist:');
      console.log('   - [ ] Backup created');
      console.log('   - [ ] Dry run completed successfully');
      console.log('   - [ ] Maintenance window scheduled');
      console.log('   - [ ] Rollback plan prepared');
      
      if (!options.skipConfirmation) {
        console.log('🔴 PRODUCTION SAFETY: Manual confirmation required');
        return false; // Require manual confirmation in production
      }
    }
    
    let backupFile = null;
    
    try {
      // Step 1: 백업 생성
      backupFile = await this.createBackup(migrationName);
      
      // Step 2: Dry run 검증 (Production에서는 필수)
      if (this.isDryRun || this.isProduction) {
        await this.dryRunMigration(migrationFunction, migrationName);
      }
      
      // Step 3: 실제 마이그레이션 실행
      if (!this.isDryRun) {
        await this.executeMigration(migrationFunction, migrationName, backupFile);
      }
      
      return true;
    } catch (error) {
      console.error(`❌ Migration failed: ${error.message}`);
      
      if (backupFile && !this.isDryRun) {
        console.log('🔄 Attempting automatic recovery from backup...');
        await this.restoreFromBackup(backupFile);
      }
      
      throw error;
    }
  }

  // 4. 실제 마이그레이션 실행
  async executeMigration(migrationFunction, migrationName, backupFile) {
    const client = await this.pool.connect();
    
    try {
      console.log(`🔄 Executing migration: ${migrationName}`);
      
      // 마이그레이션 실행 기록
      await this.recordMigrationStart(client, migrationName);
      
      await client.query('BEGIN');
      
      // 실제 마이그레이션 실행
      await migrationFunction(client, false); // false = real execution
      
      await client.query('COMMIT');
      
      // 성공 기록
      await this.recordMigrationSuccess(client, migrationName);
      
      console.log(`✅ Migration completed successfully: ${migrationName}`);
      
    } catch (error) {
      await client.query('ROLLBACK');
      
      // 실패 기록
      await this.recordMigrationFailure(client, migrationName, error.message);
      
      throw error;
    } finally {
      client.release();
    }
  }

  // 5. 안전한 롤백 (데이터 보존)
  async safeRollback(migrationName, options = {}) {
    console.log(`🔄 Starting safe rollback: ${migrationName}`);
    
    // Production에서는 롤백도 확인 필요
    if (this.isProduction && !options.skipConfirmation) {
      console.log('🔴 PRODUCTION ROLLBACK: Manual confirmation required');
      console.log('   This will restore from backup and may cause data loss');
      console.log('   Please run: npm run migrate:rollback:confirm');
      return false;
    }
    
    try {
      // 최신 백업 파일 찾기
      const latestBackup = this.findLatestBackup(migrationName);
      
      if (!latestBackup) {
        throw new Error(`No backup found for migration: ${migrationName}`);
      }
      
      console.log(`📁 Found backup: ${latestBackup}`);
      
      // 백업으로부터 복구
      await this.restoreFromBackup(latestBackup);
      
      console.log(`✅ Rollback completed successfully: ${migrationName}`);
      
    } catch (error) {
      console.error(`❌ Rollback failed: ${error.message}`);
      throw error;
    }
  }

  // 6. 백업으로부터 복구
  async restoreFromBackup(backupFile) {
    console.log(`🔄 Restoring from backup: ${backupFile}`);
    
    const { exec } = require('child_process');
    const restoreCommand = `psql -h ${process.env.DB_HOST || 'localhost'} -U ${process.env.DB_USER || 'postgres'} -d ${process.env.DB_NAME || 'baro_calendar'} < "${backupFile}"`;
    
    return new Promise((resolve, reject) => {
      exec(restoreCommand, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ Restore failed: ${error}`);
          reject(error);
        } else {
          console.log(`✅ Database restored from backup`);
          resolve(stdout);
        }
      });
    });
  }

  // 7. 마이그레이션 기록 관리
  async recordMigrationStart(client, migrationName) {
    await client.query(`
      INSERT INTO migration_history (name, started_at, status)
      VALUES ($1, NOW(), 'RUNNING')
      ON CONFLICT (name) DO UPDATE SET
        started_at = NOW(),
        status = 'RUNNING'
    `, [migrationName]);
  }

  async recordMigrationSuccess(client, migrationName) {
    await client.query(`
      UPDATE migration_history
      SET completed_at = NOW(), status = 'SUCCESS'
      WHERE name = $1
    `, [migrationName]);
  }

  async recordMigrationFailure(client, migrationName, error) {
    await client.query(`
      UPDATE migration_history
      SET completed_at = NOW(), status = 'FAILED', error_message = $2
      WHERE name = $1
    `, [migrationName, error]);
  }

  // 8. 유틸리티 함수들
  findLatestBackup(migrationName) {
    if (!fs.existsSync(this.backupPath)) {
      return null;
    }
    
    const backupFiles = fs.readdirSync(this.backupPath)
      .filter(file => file.includes(migrationName) && file.endsWith('.sql'))
      .sort()
      .reverse();
    
    return backupFiles.length > 0 ? path.join(this.backupPath, backupFiles[0]) : null;
  }

  async ensureMigrationTable() {
    const client = await this.pool.connect();
    
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS migration_history (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL,
          started_at TIMESTAMP WITH TIME ZONE,
          completed_at TIMESTAMP WITH TIME ZONE,
          status VARCHAR(20) DEFAULT 'PENDING',
          error_message TEXT,
          backup_file VARCHAR(500),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
    } finally {
      client.release();
    }
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = SafeMigrationManager;