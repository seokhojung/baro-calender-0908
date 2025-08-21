/**
 * Jest 테스트 설정 파일
 * 모든 테스트 실행 전 공통 설정
 */

// 환경 변수 설정
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'baro_calendar_test';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'password';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.JWT_SECRET = 'test-jwt-secret-key';

// 전역 테스트 타임아웃 설정
jest.setTimeout(30000);

// 콘솔 로그 억제 (테스트 중 불필요한 로그 제거)
global.console = {
  ...console,
  // info와 log는 유지, warn과 error는 테스트 실패 시에만 출력
  warn: jest.fn(),
  error: jest.fn(),
};

// 테스트 데이터베이스 연결 정보
global.TEST_DB_CONFIG = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};

// 공통 테스트 헬퍼 함수들
global.testHelpers = {
  // 랜덤 문자열 생성
  generateRandomString: (length = 10) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
  
  // 랜덤 이메일 생성
  generateRandomEmail: () => {
    const randomString = global.testHelpers.generateRandomString(8);
    return `${randomString}@test.com`;
  },
  
  // 랜덤 색상 코드 생성
  generateRandomColor: () => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    return colors[Math.floor(Math.random() * colors.length)];
  },
  
  // 테스트용 사용자 데이터 생성
  createTestUser: (overrides = {}) => ({
    email: global.testHelpers.generateRandomEmail(),
    password_hash: '$2b$10$test.hash.for.testing.purposes.only',
    first_name: 'Test',
    last_name: 'User',
    role: 'user',
    status: 'active',
    tenant_id: 1,
    ...overrides
  }),
  
  // 테스트용 프로젝트 데이터 생성
  createTestProject: (overrides = {}) => ({
    name: `Test Project ${global.testHelpers.generateRandomString(5)}`,
    description: 'Test project description',
    color: global.testHelpers.generateRandomColor(),
    tenant_id: 1,
    owner_id: 1,
    settings: {
      default_view: 'month',
      show_weekends: true
    },
    ...overrides
  }),
  
  // 테스트용 멤버 데이터 생성
  createTestMember: (overrides = {}) => ({
    tenant_id: 1,
    project_id: 1,
    user_id: 1,
    role: 'Editor',
    invited_at: new Date(),
    accepted_at: new Date(),
    ...overrides
  })
};

// 테스트 실행 전 로그
console.log('🧪 테스트 환경 설정 완료');
console.log(`📊 테스트 데이터베이스: ${process.env.DB_NAME}`);
console.log(`🔑 JWT 시크릿: ${process.env.JWT_SECRET ? '설정됨' : '설정되지 않음'}`);
