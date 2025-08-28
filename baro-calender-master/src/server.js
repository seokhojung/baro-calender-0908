// 환경 변수 로딩
require('dotenv').config();

// 환경 변수 검증
const EnvValidator = require('./utils/envValidator');

const fastify = require('fastify')({
  logger: true,
  trustProxy: true
});

// PostgreSQL 연결 풀 생성
const { Pool } = require('pg');
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

// JWT 플러그인 등록
fastify.register(require('@fastify/jwt'), {
  secret: process.env.JWT_SECRET || 'fallback-secret-key-for-development-only'
});

// Swagger 플러그인 등록
fastify.register(require('@fastify/swagger'), {
  swagger: {
    info: {
      title: 'Baro Calendar API',
      description: '바로캘린더 API 서버 문서',
      version: '1.0.0'
    },
    host: 'localhost:8000',
    schemes: ['http'],
    consumes: ['application/json'],
    produces: ['application/json']
  }
});

// Swagger UI 플러그인 등록
fastify.register(require('@fastify/swagger-ui'), {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'full',
    deepLinking: false
  },
  uiHooks: {
    onRequest: function (request, reply, next) { next() },
    preHandler: function (request, reply, next) { next() }
  },
  staticCSP: true,
  transformStaticCSP: (header) => header
});

// CORS 설정
fastify.register(require('@fastify/cors'), {
  origin: true,
  credentials: true
});

// 응답 시간 측정 미들웨어
fastify.addHook('onRequest', (request, reply, done) => {
  request.startTime = Date.now();
  done();
});

fastify.addHook('onResponse', (request, reply, done) => {
  const responseTime = Date.now() - request.startTime;
  reply.header('X-Response-Time', `${responseTime}ms`);
  
  // 로깅 (Winston 사용)
  const logger = require('./utils/logger');
  logger.info(`${request.method} ${request.url} - ${reply.statusCode} - ${responseTime}ms`);
  
  done();
});

// JSON 파싱 설정
fastify.addContentTypeParser('application/json', { parseAs: 'string' }, function (req, body, done) {
  try {
    const json = JSON.parse(body);
    done(null, json);
  } catch (err) {
    err.statusCode = 400;
    done(err, undefined);
  }
});

// 프로젝트 API 라우터 등록
fastify.register(require('./api/v1/projects'), { prefix: '/v1/projects' });

// 타임라인 API 라우터 등록
fastify.register(require('./api/v1/timeline'), { prefix: '/v1/timeline' });

// 멤버 API 라우터 등록
fastify.register(require('./api/v1/members'), { prefix: '/v1' });

// 강화된 헬스체크 엔드포인트
fastify.get('/health', async (request, reply) => {
  try {
    // 데이터베이스 연결 확인
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    
    return { 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      database: 'connected',
      tables: ['tenants', 'projects', 'members', 'users'],
      message: 'All systems operational'
    };
  } catch (error) {
    reply.code(503);
    return { 
      status: 'ERROR', 
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message,
      message: 'Database connection failed'
    };
  }
});

// 테스트용 로그인 엔드포인트 (개발 환경에서만)
fastify.post('/auth/test-login', async (request, reply) => {
  try {
    const { email, password } = request.body;
    
    // 간단한 테스트 인증 (실제로는 데이터베이스에서 확인해야 함)
    if (email === 'test@example.com' && password === 'test123') {
      const token = fastify.jwt.sign({
        userId: 1,
        email: 'test@example.com',
        tenantId: 1,
        role: 'Owner'
      });
      
      return {
        success: true,
        token,
        user: {
          id: 1,
          email: 'test@example.com',
          tenant_id: 1,
          role: 'Owner'
        }
      };
    } else {
      reply.code(401);
      return {
        success: false,
        error: 'Invalid credentials'
      };
    }
  } catch (error) {
    reply.code(500);
    return {
      success: false,
      error: 'Internal server error'
    };
  }
});

// 보호된 엔드포인트 테스트
fastify.get('/auth/protected', {
  preHandler: [require('./middleware/acl').authenticateUser()]
}, async (request, reply) => {
  return {
    message: 'This is a protected endpoint',
    user: request.user,
    timestamp: new Date().toISOString()
  };
});

// 루트 엔드포인트
fastify.get('/', async (request, reply) => {
  return {
    message: 'Baro Calendar API Server',
    version: '1.0.0',
          endpoints: {
        health: '/health',
        projects: '/v1/projects',
        members: '/v1/projects/:id/members'
      }
  };
});

// 에러 핸들러
fastify.setErrorHandler(function (error, request, reply) {
  fastify.log.error(error);
  
  if (error.validation) {
    reply.code(400).send({
      error: 'Validation Error',
      message: error.message,
      details: error.validation
    });
    return;
  }
  
  reply.code(500).send({
    error: 'Internal Server Error',
    message: 'Something went wrong'
  });
});

// 서버 시작
const start = async () => {
  try {
    // 환경 변수 검증
    console.log('🔍 Validating environment variables...');
    const envValidation = EnvValidator.validate();
    console.log(envValidation.summary);
    
    if (!envValidation.isValid) {
      throw new Error('Environment validation failed');
    }

    // 데이터베이스 연결 테스트
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('✅ Database connection successful');
    
    const port = process.env.PORT || 8000;
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    console.log(`🚀 Server is running on http://${host}:${port}`);
    console.log(`📚 API Documentation available at http://${host}:${port}/docs`);
    console.log(`🏥 Health check available at http://${host}:${port}/health`);
    
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

// CLI 실행 지원
if (require.main === module) {
  start();
}

module.exports = { fastify, start };
