/**
 * 환경 변수 검증 유틸리티
 */

class EnvValidator {
  /**
   * 필수 환경 변수 목록
   */
  static requiredEnvVars = [
    'DB_USER',
    'DB_HOST', 
    'DB_NAME',
    'DB_PASSWORD',
    'JWT_SECRET'
  ];

  /**
   * 환경 변수 검증
   * @returns {Object} 검증 결과
   */
  static validate() {
    const missing = [];
    const invalid = [];
    const warnings = [];

    // 필수 환경 변수 확인
    for (const envVar of this.requiredEnvVars) {
      if (!process.env[envVar]) {
        missing.push(envVar);
      }
    }

    // JWT_SECRET 강도 검증
    if (process.env.JWT_SECRET) {
      if (process.env.JWT_SECRET.length < 32) {
        invalid.push({
          name: 'JWT_SECRET',
          reason: 'JWT_SECRET must be at least 32 characters long'
        });
      }
      
      if (process.env.JWT_SECRET === 'your-secret-key') {
        warnings.push({
          name: 'JWT_SECRET',
          reason: 'JWT_SECRET should not use default value'
        });
      }
    }

    // 데이터베이스 포트 검증
    if (process.env.DB_PORT) {
      const port = parseInt(process.env.DB_PORT);
      if (isNaN(port) || port < 1 || port > 65535) {
        invalid.push({
          name: 'DB_PORT',
          reason: 'DB_PORT must be a valid port number (1-65535)'
        });
      }
    }

    // NODE_ENV 검증
    if (process.env.NODE_ENV && !['development', 'production', 'test'].includes(process.env.NODE_ENV)) {
      warnings.push({
        name: 'NODE_ENV',
        reason: 'NODE_ENV should be one of: development, production, test'
      });
    }

    return {
      isValid: missing.length === 0 && invalid.length === 0,
      missing,
      invalid,
      warnings,
      summary: this.generateSummary(missing, invalid, warnings)
    };
  }

  /**
   * 검증 결과 요약 생성
   */
  static generateSummary(missing, invalid, warnings) {
    let summary = 'Environment validation ';
    
    if (missing.length === 0 && invalid.length === 0) {
      summary += '✅ PASSED';
    } else {
      summary += '❌ FAILED';
    }

    if (missing.length > 0) {
      summary += `\n  Missing: ${missing.join(', ')}`;
    }

    if (invalid.length > 0) {
      summary += `\n  Invalid: ${invalid.map(i => `${i.name} (${i.reason})`).join(', ')}`;
    }

    if (warnings.length > 0) {
      summary += `\n  Warnings: ${warnings.map(w => `${w.name} (${w.reason})`).join(', ')}`;
    }

    return summary;
  }

  /**
   * 환경 변수 검증 및 에러 발생
   * @throws {Error} 검증 실패 시 에러 발생
   */
  static validateAndThrow() {
    const result = this.validate();
    
    if (!result.isValid) {
      throw new Error(`Environment validation failed:\n${result.summary}`);
    }

    if (result.warnings.length > 0) {
      console.warn('Environment validation warnings:\n', result.warnings);
    }

    return result;
  }

  /**
   * 개발 환경 전용 검증
   */
  static validateDevelopment() {
    const result = this.validate();
    
    // 개발 환경에서는 경고만 표시하고 계속 진행
    if (result.warnings.length > 0) {
      console.warn('Development environment warnings:\n', result.warnings);
    }

    return result;
  }

  /**
   * 프로덕션 환경 전용 검증
   */
  static validateProduction() {
    const result = this.validate();
    
    if (!result.isValid) {
      throw new Error(`Production environment validation failed:\n${result.summary}`);
    }

    // 프로덕션에서는 경고도 에러로 처리
    if (result.warnings.length > 0) {
      throw new Error(`Production environment warnings:\n${result.warnings.map(w => `${w.name}: ${w.reason}`).join('\n')}`);
    }

    return result;
  }
}

module.exports = EnvValidator;
