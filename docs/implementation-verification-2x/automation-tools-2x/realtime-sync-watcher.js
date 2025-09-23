#!/usr/bin/env node
/**
 * Realtime Sync Watcher: 실시간 파일 변경 감지 및 자동 동기화
 * 코드 및 문서 변경을 실시간으로 감지하여 자동 동기화 실행
 */

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const IntegratedSyncMonitor = require('./integrated-sync-monitor');

class RealtimeSyncWatcher {
  constructor() {
    this.projectRoot = process.cwd();
    this.isRunning = false;
    this.lastSyncTime = 0;
    this.syncCooldown = 30000; // 30초 쿨다운
    this.monitor = new IntegratedSyncMonitor();

    // 감시할 경로들
    this.watchPaths = [
      'client/src/**/*.{ts,tsx,js,jsx}',           // 소스 코드
      'docs/frontend-stories/**/*.md',              // Story 문서
      'docs/implementation-verification-2x/checklists-2x/**/*.md', // 체크리스트
      'docs/implementation-verification-2x/COMPREHENSIVE-WORKFLOW-GUIDE.md', // 워크플로우 가이드
      'client/package.json',                       // 의존성 변경
      'client/jest.config.js',                     // 테스트 설정
      'client/playwright.config.ts'                // E2E 설정
    ];

    // 무시할 패턴들
    this.ignorePaths = [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/build/**',
      '**/.git/**',
      '**/coverage/**',
      '**/test-results/**'
    ];
  }

  // 실시간 감시 시작
  async start() {
    console.log('👁️  실시간 동기화 감시 시작...\n');

    try {
      this.isRunning = true;

      // 파일 와처 설정
      this.watcher = chokidar.watch(this.watchPaths, {
        ignored: this.ignorePaths,
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
          stabilityThreshold: 2000,
          pollInterval: 100
        }
      });

      // 이벤트 리스너 설정
      this.setupEventListeners();

      // 초기 동기화 체크
      await this.performInitialSync();

      console.log('✅ 실시간 감시 활성화 완료');
      console.log('📋 감시 중인 경로:');
      this.watchPaths.forEach(path => console.log(`   - ${path}`));
      console.log('\n🔄 파일 변경 시 자동으로 동기화 체크가 실행됩니다.');
      console.log('⏹️  중지하려면 Ctrl+C를 누르세요.\n');

      // 프로세스 종료 시 정리
      process.on('SIGINT', () => this.stop());
      process.on('SIGTERM', () => this.stop());

      return true;

    } catch (error) {
      console.error('❌ 실시간 감시 시작 실패:', error.message);
      return false;
    }
  }

  // 이벤트 리스너 설정
  setupEventListeners() {
    // 파일 변경 감지
    this.watcher.on('change', (filePath) => {
      this.handleFileChange('변경', filePath);
    });

    // 파일 추가 감지
    this.watcher.on('add', (filePath) => {
      this.handleFileChange('추가', filePath);
    });

    // 파일 삭제 감지
    this.watcher.on('unlink', (filePath) => {
      this.handleFileChange('삭제', filePath);
    });

    // 에러 처리
    this.watcher.on('error', (error) => {
      console.error('🚨 파일 감시 오류:', error.message);
    });
  }

  // 파일 변경 처리
  async handleFileChange(action, filePath) {
    const now = Date.now();
    const relativePath = path.relative(this.projectRoot, filePath);

    console.log(`📝 파일 ${action}: ${relativePath}`);

    // 쿨다운 체크
    if (now - this.lastSyncTime < this.syncCooldown) {
      console.log(`⏳ 쿨다운 중... (${Math.ceil((this.syncCooldown - (now - this.lastSyncTime)) / 1000)}초 남음)`);
      return;
    }

    // 파일 유형별 처리
    const fileType = this.getFileType(filePath);
    await this.handleFileTypeChange(fileType, action, relativePath);
  }

  // 파일 유형 분류
  getFileType(filePath) {
    if (filePath.includes('docs/frontend-stories/')) return 'story-doc';
    if (filePath.includes('docs/implementation-verification-2x/checklists-2x/')) return 'checklist';
    if (filePath.includes('COMPREHENSIVE-WORKFLOW-GUIDE.md')) return 'workflow-guide';
    if (filePath.includes('client/src/') && (filePath.endsWith('.ts') || filePath.endsWith('.tsx'))) return 'source-code';
    if (filePath.includes('client/src/') && (filePath.endsWith('.test.ts') || filePath.endsWith('.test.tsx'))) return 'test-code';
    if (filePath.includes('package.json')) return 'dependency';
    if (filePath.includes('config')) return 'config';
    return 'other';
  }

  // 파일 유형별 변경 처리
  async handleFileTypeChange(fileType, action, relativePath) {
    const handlers = {
      'story-doc': () => this.handleStoryDocChange(action, relativePath),
      'checklist': () => this.handleChecklistChange(action, relativePath),
      'workflow-guide': () => this.handleWorkflowGuideChange(action, relativePath),
      'source-code': () => this.handleSourceCodeChange(action, relativePath),
      'test-code': () => this.handleTestCodeChange(action, relativePath),
      'dependency': () => this.handleDependencyChange(action, relativePath),
      'config': () => this.handleConfigChange(action, relativePath),
      'other': () => this.handleOtherChange(action, relativePath)
    };

    const handler = handlers[fileType] || handlers['other'];
    await handler();
  }

  // Story 문서 변경 처리
  async handleStoryDocChange(action, relativePath) {
    console.log(`📚 Story 문서 ${action} 감지 - 즉시 동기화 체크 실행`);
    await this.triggerSync('story-doc-change', relativePath);
  }

  // 체크리스트 변경 처리
  async handleChecklistChange(action, relativePath) {
    console.log(`📋 체크리스트 ${action} 감지 - 동기화 상태 체크`);
    await this.triggerSync('checklist-change', relativePath);
  }

  // 워크플로우 가이드 변경 처리
  async handleWorkflowGuideChange(action, relativePath) {
    console.log(`📖 워크플로우 가이드 ${action} 감지 - 가이드 동기화 체크`);
    await this.triggerSync('workflow-guide-change', relativePath);
  }

  // 소스 코드 변경 처리
  async handleSourceCodeChange(action, relativePath) {
    console.log(`💻 소스 코드 ${action} 감지 - 빌드 상태 체크 및 동기화`);

    // TypeScript 컴파일 체크
    try {
      const { execSync } = require('child_process');
      execSync('cd client && npx tsc --noEmit', { stdio: 'pipe' });
      console.log('   ✅ TypeScript 컴파일 성공');
    } catch (error) {
      console.log('   ❌ TypeScript 컴파일 오류 감지');
    }

    await this.triggerSync('source-code-change', relativePath);
  }

  // 테스트 코드 변경 처리
  async handleTestCodeChange(action, relativePath) {
    console.log(`🧪 테스트 코드 ${action} 감지 - 테스트 실행 및 동기화`);
    await this.triggerSync('test-code-change', relativePath);
  }

  // 의존성 변경 처리
  async handleDependencyChange(action, relativePath) {
    console.log(`📦 의존성 ${action} 감지 - 전체 시스템 체크`);
    await this.triggerSync('dependency-change', relativePath);
  }

  // 설정 변경 처리
  async handleConfigChange(action, relativePath) {
    console.log(`⚙️  설정 파일 ${action} 감지 - 설정 검증 및 동기화`);
    await this.triggerSync('config-change', relativePath);
  }

  // 기타 파일 변경 처리
  async handleOtherChange(action, relativePath) {
    console.log(`📄 기타 파일 ${action} 감지`);
    // 기타 파일은 동기화 트리거하지 않음
  }

  // 동기화 트리거
  async triggerSync(reason, filePath) {
    console.log(`🔄 동기화 트리거: ${reason}`);

    try {
      const success = await this.monitor.run();
      this.lastSyncTime = Date.now();

      if (success) {
        console.log('✅ 자동 동기화 완료\n');
      } else {
        console.log('⚠️  동기화에서 이슈 발견\n');
      }
    } catch (error) {
      console.error('❌ 동기화 실행 실패:', error.message);
    }
  }

  // 초기 동기화 체크
  async performInitialSync() {
    console.log('🔍 초기 동기화 상태 체크...');

    try {
      await this.monitor.run();
      console.log('✅ 초기 동기화 체크 완료\n');
    } catch (error) {
      console.error('⚠️  초기 동기화 체크 실패:', error.message);
    }
  }

  // 감시 중지
  async stop() {
    console.log('\n🛑 실시간 감시 중지 중...');

    this.isRunning = false;

    if (this.watcher) {
      await this.watcher.close();
      console.log('✅ 파일 와처 종료 완료');
    }

    console.log('👋 실시간 동기화 감시가 종료되었습니다.');
    process.exit(0);
  }

  // 상태 출력
  printStatus() {
    console.log('\n📊 실시간 감시 상태:');
    console.log(`   - 상태: ${this.isRunning ? '🟢 실행 중' : '🔴 중지됨'}`);
    console.log(`   - 마지막 동기화: ${this.lastSyncTime ? new Date(this.lastSyncTime).toLocaleString() : '없음'}`);
    console.log(`   - 감시 경로: ${this.watchPaths.length}개`);
  }
}

// 종속성 체크 및 설치 안내
function checkDependencies() {
  try {
    require('chokidar');
  } catch (error) {
    console.error('❌ chokidar 패키지가 필요합니다.');
    console.log('📦 설치 명령어: npm install chokidar');
    console.log('또는 yarn add chokidar');
    process.exit(1);
  }
}

// CLI 실행 부분
if (require.main === module) {
  checkDependencies();

  const watcher = new RealtimeSyncWatcher();

  const args = process.argv.slice(2);

  if (args.includes('--status')) {
    watcher.printStatus();
  } else {
    watcher.start().then(success => {
      if (!success) {
        process.exit(1);
      }
    });
  }
}

module.exports = RealtimeSyncWatcher;