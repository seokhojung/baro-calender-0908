const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class ServerStatus {
  /**
   * 서버가 특정 포트에서 실행 중인지 확인
   * @param {number} port - 확인할 포트 번호
   * @returns {Promise<boolean>} 서버 실행 상태
   */
  static async isServerRunning(port = 8000) {
    try {
      const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
      return stdout.trim().length > 0;
    } catch (error) {
      // 에러가 발생하면 서버가 실행되지 않은 것
      return false;
    }
  }

  /**
   * 서버 상태를 상세하게 확인
   * @param {number} port - 확인할 포트 번호
   * @returns {Promise<Object>} 서버 상태 정보
   */
  static async getServerStatus(port = 8000) {
    try {
      const isRunning = await this.isServerRunning(port);
      
      if (!isRunning) {
        return {
          running: false,
          port: port,
          message: `Port ${port} is not in use`
        };
      }

      // 서버가 실행 중인 경우 프로세스 정보 가져오기
      const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
      const lines = stdout.trim().split('\n');
      
      return {
        running: true,
        port: port,
        message: `Server is running on port ${port}`,
        connections: lines.length,
        details: lines.map(line => line.trim())
      };
    } catch (error) {
      return {
        running: false,
        port: port,
        error: error.message,
        message: `Failed to check server status on port ${port}`
      };
    }
  }

  /**
   * 서버가 실행 중이 아니면 백그라운드로 시작
   * @param {number} port - 시작할 포트 번호
   * @returns {Promise<Object>} 시작 결과
   */
  static async startServerIfNeeded(port = 3000) {
    try {
      const status = await this.getServerStatus(port);
      
      if (status.running) {
        return {
          started: false,
          message: `Server is already running on port ${port}`,
          status: status
        };
      }

      // 서버가 실행되지 않은 경우 백그라운드로 시작
      return await this.startServerInBackground(port);
      
    } catch (error) {
      return {
        started: false,
        error: error.message,
        message: `Failed to start server on port ${port}`
      };
    }
  }

  /**
   * 서버를 백그라운드에서 시작
   * @param {number} port - 서버 포트
   * @returns {Promise<Object>} 시작 결과
   */
  static async startServerInBackground(port = 3000) {
    try {
      console.log(`🚀 Starting server on port ${port}...`);
      
      // Windows PowerShell에서 백그라운드로 실행
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      // Start-Job을 사용하여 완전히 분리된 백그라운드 실행
      const command = `Start-Job { Set-Location '${process.cwd()}'; npm run dev } | Out-Null; Write-Host 'Server started in background'`;
      
      await execAsync(command, { shell: 'powershell.exe' });
      
      // 잠시 대기 후 서버 상태 확인
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const status = await this.getServerStatus(port);
      
      if (status.running) {
        console.log('✅ Server started successfully in background');
        return {
          success: true,
          message: `Server started successfully in background on port ${port}`,
          pid: status.pid,
          port: port
        };
      } else {
        throw new Error('Server failed to start');
      }
      
    } catch (error) {
      console.error('❌ Failed to start server:', error.message);
      throw error;
    }
  }

  /**
   * 서버 프로세스 종료
   * @param {number} port - 종료할 포트 번호
   * @returns {Promise<Object>} 종료 결과
   */
  static async stopServer(port = 3000) {
    try {
      const status = await this.getServerStatus(port);
      
      if (!status.running) {
        return {
          stopped: false,
          message: `No server running on port ${port}`
        };
      }

      // 포트를 사용하는 프로세스 찾기
      const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
      const lines = stdout.trim().split('\n');
      
      let stoppedCount = 0;
      
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5) {
          const pid = parts[4];
          try {
            await execAsync(`taskkill /PID ${pid} /F`);
            stoppedCount++;
          } catch (killError) {
            console.log(`Failed to kill process ${pid}: ${killError.message}`);
          }
        }
      }

      return {
        stopped: true,
        message: `Stopped ${stoppedCount} server process(es) on port ${port}`,
        processesKilled: stoppedCount
      };
    } catch (error) {
      return {
        stopped: false,
        error: error.message,
        message: `Failed to stop server on port ${port}`
      };
    }
  }
}

module.exports = ServerStatus;
