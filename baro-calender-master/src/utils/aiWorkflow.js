const ServerStatus = require('./serverStatus');

class AIWorkflow {
  /**
   * AI 작업 시작 전 서버 상태 확인 및 준비
   * @param {number} port - 확인할 포트 번호
   * @returns {Promise<Object>} 준비 상태
   */
  static async prepareForWork(port = 3000) {
    console.log('🔍 Checking server status before starting work...');
    
    try {
      // 1. 서버 상태 확인
      const status = await ServerStatus.getServerStatus(port);
      
      if (status.running) {
        console.log(`✅ Server is already running on port ${port}`);
        console.log(`📊 Server status: ${status.message}`);
        return {
          ready: true,
          message: `Ready to work - server is running on port ${port}`,
          status: status,
          action: 'none'
        };
      }

      // 2. 서버가 실행되지 않은 경우 백그라운드로 시작
      console.log(`🚀 Server not running. Starting server in background...`);
      const startResult = await ServerStatus.startServerIfNeeded(port);
      
      if (startResult.started) {
        console.log(`✅ Server started successfully in background`);
        return {
          ready: true,
          message: `Ready to work - server started in background on port ${port}`,
          status: startResult.status,
          action: 'started',
          pid: startResult.pid
        };
      } else {
        console.log(`❌ Failed to start server: ${startResult.message}`);
        return {
          ready: false,
          message: `Cannot start work - server failed to start`,
          error: startResult.error,
          action: 'failed'
        };
      }
    } catch (error) {
      console.log(`❌ Error preparing for work: ${error.message}`);
      return {
        ready: false,
        message: `Error preparing for work`,
        error: error.message,
        action: 'error'
      };
    }
  }

  /**
   * 작업 완료 후 정리 (필요한 경우)
   * @param {boolean} keepServerRunning - 서버를 계속 실행할지 여부
   * @param {number} port - 서버 포트
   * @returns {Promise<Object>} 정리 결과
   */
  static async cleanupAfterWork(keepServerRunning = true, port = 3000) {
    console.log('🧹 Cleaning up after work...');
    
    if (!keepServerRunning) {
      console.log('🛑 Stopping server as requested...');
      const stopResult = await ServerStatus.stopServer(port);
      return {
        cleaned: true,
        message: 'Work completed and server stopped',
        serverStopped: stopResult.stopped
      };
    } else {
      console.log('✅ Work completed - server kept running for future use');
      return {
        cleaned: true,
        message: 'Work completed - server kept running',
        serverStopped: false
      };
    }
  }

  /**
   * 작업 실행 전 체크리스트
   * @returns {Promise<Object>} 체크리스트 결과
   */
  static async preWorkChecklist() {
    console.log('📋 Running pre-work checklist...');
    
    const checklist = {
      serverStatus: null,
      databaseConnection: null,
      environmentVariables: null,
      allChecksPassed: false
    };

    try {
      // 1. 서버 상태 확인
      const serverStatus = await ServerStatus.getServerStatus();
      checklist.serverStatus = serverStatus.running ? '✅ Running' : '❌ Not running';

      // 2. 환경 변수 확인 (간단한 체크)
      const requiredEnvVars = ['DB_HOST', 'DB_NAME', 'DB_PASSWORD', 'JWT_SECRET'];
      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      checklist.environmentVariables = missingVars.length === 0 ? '✅ All required' : `❌ Missing: ${missingVars.join(', ')}`;

      // 3. 데이터베이스 연결 확인 (간단한 체크)
      checklist.databaseConnection = '⏳ Will check during server start';

      // 4. 전체 체크 결과
      checklist.allChecksPassed = serverStatus.running && missingVars.length === 0;

      console.log('📋 Pre-work checklist completed:');
      console.log(`   Server: ${checklist.serverStatus}`);
      console.log(`   Environment: ${checklist.environmentVariables}`);
      console.log(`   Database: ${checklist.databaseConnection}`);
      console.log(`   Overall: ${checklist.allChecksPassed ? '✅ Ready' : '❌ Issues found'}`);

      return checklist;
    } catch (error) {
      console.log(`❌ Error running checklist: ${error.message}`);
      checklist.allChecksPassed = false;
      return checklist;
    }
  }

  /**
   * AI 작업 가이드라인 반환
   * @returns {string} 작업 가이드라인
   */
  static getWorkGuidelines() {
    return `
🚀 **AI 작업 가이드라인 - 터미널 점유 방지**

✅ **해야 할 일:**
- 서버 실행은 반드시 백그라운드로 수행
- 짧게 끝나는 명령만 실행 (테스트, 빌드, 린트 등)
- 서버 상태 확인 후 필요시에만 시작
- 작업 완료 후 즉시 터미널 반환

❌ **하지 말아야 할 일:**
- 포그라운드에서 서버 실행 (터미널 점유)
- 무한 대기하는 프로세스 실행
- Agent를 "실행 중" 상태로 방치

🔄 **서버 관리 워크플로우:**
1. prepareForWork() - 서버 상태 확인 및 백그라운드 시작
2. 작업 수행 (빠른 명령어만)
3. cleanupAfterWork() - 필요시 서버 정리

📝 **권장 명령어:**
- npm run lint (린트 검사)
- npm run test (테스트 실행)
- npm run build (빌드)
- 서버 상태 확인 및 관리
    `;
  }
}

module.exports = AIWorkflow;
