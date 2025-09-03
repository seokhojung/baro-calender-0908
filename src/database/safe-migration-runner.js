#!/usr/bin/env node

const SafeMigrationManager = require('./safe-migration');
const path = require('path');
const fs = require('fs');

// 안전한 마이그레이션 실행기
class SafeMigrationRunner {
  constructor() {
    this.migrationManager = new SafeMigrationManager();
    this.migrationsPath = path.join(__dirname, 'migrations');
  }

  async run() {
    const command = process.argv[2] || 'help';
    const argument = process.argv[3];

    try {
      await this.migrationManager.ensureMigrationTable();

      switch (command) {
        case 'up':
        case 'run':
          await this.runMigrations(argument);
          break;
        case 'rollback':
          await this.rollbackMigration(argument);
          break;
        case 'backup':
          await this.createBackup(argument);
          break;
        case 'restore':
          await this.restoreBackup(argument);
          break;
        case 'status':
          await this.showStatus();
          break;
        case 'dry-run':
          process.env.MIGRATION_DRY_RUN = 'true';
          await this.runMigrations(argument);
          break;
        case 'help':
        default:
          this.showHelp();
          break;
      }
    } catch (error) {
      console.error(`❌ Migration failed: ${error.message}`);
      process.exit(1);
    } finally {
      await this.migrationManager.close();
    }
  }

  async runMigrations(specificMigration) {
    console.log('🚀 Starting safe migration process...');
    
    const migrations = this.getMigrationFiles();
    const migrationsToRun = specificMigration 
      ? migrations.filter(m => m.includes(specificMigration))
      : migrations;

    if (migrationsToRun.length === 0) {
      console.log('✅ No migrations to run');
      return;
    }

    for (const migrationFile of migrationsToRun) {
      const migrationName = path.basename(migrationFile, '.js');
      console.log(`\n📋 Processing migration: ${migrationName}`);
      
      try {
        const migration = require(migrationFile);
        
        if (typeof migration.up !== 'function') {
          console.log(`⚠️ Skipping ${migrationName}: No up() function found`);
          continue;
        }

        const success = await this.migrationManager.runMigrationSafely(
          migration.up,
          migrationName,
          {
            skipConfirmation: process.env.SKIP_CONFIRMATION === 'true'
          }
        );

        if (!success) {
          console.log(`⚠️ Migration ${migrationName} requires manual confirmation`);
          console.log('   Run with SKIP_CONFIRMATION=true to bypass (not recommended in production)');
          break;
        }

      } catch (error) {
        console.error(`❌ Migration ${migrationName} failed: ${error.message}`);
        
        if (process.env.AUTO_ROLLBACK === 'true') {
          console.log('🔄 Attempting auto-rollback...');
          await this.migrationManager.safeRollback(migrationName, { skipConfirmation: true });
        }
        
        throw error;
      }
    }
    
    console.log('\n✅ All migrations completed successfully');
  }

  async rollbackMigration(migrationName) {
    if (!migrationName) {
      console.error('❌ Please specify migration name to rollback');
      console.log('Example: npm run migrate:safe-rollback 001_create_tenant_project_member_tables');
      return;
    }

    console.log(`🔄 Starting safe rollback: ${migrationName}`);
    
    await this.migrationManager.safeRollback(migrationName, {
      skipConfirmation: process.env.SKIP_CONFIRMATION === 'true'
    });
  }

  async createBackup(name) {
    const backupName = name || `manual_backup_${Date.now()}`;
    console.log(`📦 Creating backup: ${backupName}`);
    
    const backupFile = await this.migrationManager.createBackup(backupName);
    console.log(`✅ Backup created: ${backupFile}`);
  }

  async restoreBackup(backupFile) {
    if (!backupFile) {
      console.error('❌ Please specify backup file to restore');
      console.log('Example: npm run migrate:restore-backup ./backups/backup_2025-09-03.sql');
      return;
    }

    if (!fs.existsSync(backupFile)) {
      console.error(`❌ Backup file not found: ${backupFile}`);
      return;
    }

    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PRODUCTION_RESTORE !== 'true') {
      console.error('❌ Production restore blocked for safety');
      console.log('   Set ALLOW_PRODUCTION_RESTORE=true to override (dangerous!)');
      return;
    }

    console.log(`🔄 Restoring from backup: ${backupFile}`);
    await this.migrationManager.restoreFromBackup(backupFile);
    console.log('✅ Restore completed');
  }

  async showStatus() {
    console.log('📊 Migration Status');
    console.log('==================');
    
    // 마이그레이션 히스토리 조회 구현
    const client = await this.migrationManager.pool.connect();
    
    try {
      const result = await client.query(`
        SELECT name, status, started_at, completed_at, error_message 
        FROM migration_history 
        ORDER BY started_at DESC
      `);
      
      if (result.rows.length === 0) {
        console.log('No migrations found in history');
        return;
      }
      
      result.rows.forEach(row => {
        const status = row.status === 'SUCCESS' ? '✅' : 
                     row.status === 'FAILED' ? '❌' : 
                     row.status === 'RUNNING' ? '🔄' : '⏳';
        
        console.log(`${status} ${row.name}`);
        console.log(`   Started: ${row.started_at}`);
        if (row.completed_at) {
          console.log(`   Completed: ${row.completed_at}`);
        }
        if (row.error_message) {
          console.log(`   Error: ${row.error_message}`);
        }
        console.log();
      });
      
    } finally {
      client.release();
    }
  }

  getMigrationFiles() {
    if (!fs.existsSync(this.migrationsPath)) {
      return [];
    }
    
    return fs.readdirSync(this.migrationsPath)
      .filter(file => file.endsWith('.js'))
      .sort()
      .map(file => path.join(this.migrationsPath, file));
  }

  showHelp() {
    console.log(`
🛡️  Safe Migration Runner
==========================

Usage: npm run migrate:[command] [arguments]

Commands:
  migrate:safe [name]           - Run migrations safely with backup
  migrate:dry-run [name]        - Test migrations without applying changes
  migrate:safe-rollback <name>  - Safely rollback a migration
  migrate:backup [name]         - Create a manual backup
  migrate:restore-backup <file> - Restore from backup file
  migrate:status               - Show migration status

Environment Variables:
  MIGRATION_DRY_RUN=true       - Enable dry-run mode
  SKIP_CONFIRMATION=true       - Skip manual confirmations (dangerous!)
  ALLOW_DESTRUCTIVE_ROLLBACK=true - Allow destructive operations (dev only)
  ALLOW_PRODUCTION_RESTORE=true   - Allow production restore (very dangerous!)

Examples:
  npm run migrate:dry-run                    # Test all migrations
  npm run migrate:safe 001_create_tables     # Run specific migration
  npm run migrate:backup                     # Create backup
  npm run migrate:safe-rollback events       # Rollback events migration
  
Safety Features:
  ✅ Automatic backups before migrations
  ✅ Dry-run validation
  ✅ Data existence checks before rollback
  ✅ Production environment protection
  ✅ Manual confirmation for dangerous operations
`);
  }
}

// 실행
if (require.main === module) {
  const runner = new SafeMigrationRunner();
  runner.run().catch(error => {
    console.error('❌ Migration runner failed:', error);
    process.exit(1);
  });
}

module.exports = SafeMigrationRunner;