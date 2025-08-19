// 간단한 테스트 서버
require('dotenv').config();

const fastify = require('fastify')({
  logger: true
});

// CORS 설정
fastify.register(require('@fastify/cors'), {
  origin: true,
  credentials: true
});

// 헬스체크 엔드포인트
fastify.get('/health', async (request, reply) => {
  return { 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: '바로캘린더 API 서버가 정상 작동 중입니다!'
  };
});

// 루트 엔드포인트
fastify.get('/', async (request, reply) => {
  return {
    message: 'Baro Calendar API Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health'
    }
  };
});

// 서버 시작
const start = async () => {
  try {
    const port = process.env.PORT || 3000;
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    console.log(`🚀 서버가 성공적으로 실행되었습니다!`);
    console.log(`🌐 서버 주소: http://${host}:${port}`);
    console.log(`💚 헬스체크: http://${host}:${port}/health`);
    
  } catch (err) {
    console.error('❌ 서버 시작 실패:', err);
    process.exit(1);
  }
};

// CLI 실행 지원
if (require.main === module) {
  start();
}

module.exports = { fastify, start };
