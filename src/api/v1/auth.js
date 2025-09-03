const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const twilio = require('twilio');

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'baro_calendar',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Twilio client for SMS
const twilioClient = process.env.TWILIO_ACCOUNT_SID ? 
  twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN) : null;

// Authentication API Routes
async function authRoutes(fastify, options) {
  
  // POST /v1/auth/register - 사용자 등록
  fastify.post('/register', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password', 'name'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          name: { type: 'string', minLength: 1, maxLength: 100 },
          phone_number: { type: 'string' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            user_id: { type: 'number' },
            email: { type: 'string' },
            message: { type: 'string' },
            email_verification_required: { type: 'boolean' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { email, password, name, phone_number } = request.body;
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 이메일 중복 확인
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );
      
      if (existingUser.rows.length > 0) {
        reply.code(409).send({ error: 'Email already exists' });
        return;
      }
      
      // 비밀번호 해시화
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      
      // 이메일 검증 토큰 생성
      const emailVerificationToken = require('crypto').randomBytes(32).toString('hex');
      
      // 사용자 생성
      const userResult = await client.query(`
        INSERT INTO users (
          email, password_hash, name, phone_number, 
          email_verified, email_verification_token,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING id, email, name, created_at
      `, [email, passwordHash, name, phone_number, false, emailVerificationToken]);
      
      const user = userResult.rows[0];
      
      // 인증 로그 기록
      await client.query(`
        INSERT INTO auth_logs (user_id, email, event_type, ip_address, user_agent, created_at)
        VALUES ($1, $2, 'register', $3, $4, NOW())
      `, [user.id, email, request.ip, request.headers['user-agent']]);
      
      await client.query('COMMIT');
      
      // 이메일 검증 이메일 발송 (실제 구현에서는 이메일 서비스 연동)
      fastify.log.info(`Email verification token for ${email}: ${emailVerificationToken}`);
      
      reply.code(201).send({
        user_id: user.id,
        email: user.email,
        message: 'User created successfully',
        email_verification_required: true
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      fastify.log.error(error);
      reply.code(500).send({ error: 'Registration failed' });
    } finally {
      client.release();
    }
  });

  // POST /v1/auth/login - 로그인
  fastify.post('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
          totp_code: { type: 'string' }, // 2FA 코드 (선택적)
          remember_me: { type: 'boolean', default: false }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            access_token: { type: 'string' },
            refresh_token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                email: { type: 'string' },
                name: { type: 'string' },
                two_factor_enabled: { type: 'boolean' }
              }
            },
            requires_2fa: { type: 'boolean' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { email, password, totp_code, remember_me } = request.body;
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 사용자 조회
      const userResult = await client.query(`
        SELECT id, email, name, password_hash, two_factor_enabled, 
               email_verified, account_locked_until, failed_login_attempts
        FROM users 
        WHERE email = $1
      `, [email]);
      
      if (userResult.rows.length === 0) {
        await this.logAuthEvent(client, null, email, 'login_failed', request);
        reply.code(401).send({ error: 'Invalid credentials' });
        return;
      }
      
      const user = userResult.rows[0];
      
      // 계정 잠금 확인
      if (user.account_locked_until && new Date(user.account_locked_until) > new Date()) {
        await this.logAuthEvent(client, user.id, email, 'account_locked', request);
        reply.code(423).send({ 
          error: 'Account temporarily locked',
          locked_until: user.account_locked_until
        });
        return;
      }
      
      // 이메일 인증 확인
      if (!user.email_verified) {
        reply.code(403).send({ 
          error: 'Email verification required',
          requires_email_verification: true
        });
        return;
      }
      
      // 비밀번호 확인
      const passwordValid = await bcrypt.compare(password, user.password_hash);
      if (!passwordValid) {
        // 실패 횟수 증가
        await client.query('SELECT increment_failed_login_attempts($1)', [email]);
        await this.logAuthEvent(client, user.id, email, 'login_failed', request);
        reply.code(401).send({ error: 'Invalid credentials' });
        return;
      }
      
      // 2FA 확인
      if (user.two_factor_enabled) {
        if (!totp_code) {
          reply.code(200).send({ requires_2fa: true });
          return;
        }
        
        const tfaValid = await this.verify2FA(client, user.id, totp_code);
        if (!tfaValid) {
          await this.logAuthEvent(client, user.id, email, '2fa_failed', request);
          reply.code(401).send({ error: 'Invalid 2FA code' });
          return;
        }
        
        await this.logAuthEvent(client, user.id, email, '2fa_success', request);
      }
      
      // 로그인 성공 처리
      await client.query('SELECT reset_failed_login_attempts($1)', [email]);
      
      // JWT 토큰 생성
      const tokenPayload = {
        user_id: user.id,
        email: user.email,
        name: user.name
      };
      
      const accessToken = fastify.jwt.sign(tokenPayload, {
        expiresIn: remember_me ? '7d' : '1h'
      });
      
      const refreshToken = fastify.jwt.sign(tokenPayload, {
        expiresIn: '30d'
      });
      
      // 세션 생성
      const sessionId = require('crypto').randomUUID();
      await client.query(`
        INSERT INTO user_sessions (
          user_id, session_id, jwt_token_id, device_info, ip_address,
          expires_at, created_at, last_accessed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      `, [
        user.id, sessionId, sessionId, 
        { user_agent: request.headers['user-agent'] },
        request.ip,
        new Date(Date.now() + (remember_me ? 7 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000))
      ]);
      
      await this.logAuthEvent(client, user.id, email, 'login_success', request);
      await client.query('COMMIT');
      
      reply.send({
        access_token: accessToken,
        refresh_token: refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          two_factor_enabled: user.two_factor_enabled
        }
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      fastify.log.error(error);
      reply.code(500).send({ error: 'Login failed' });
    } finally {
      client.release();
    }
  });

  // POST /v1/auth/2fa/setup - 2FA 설정
  fastify.post('/2fa/setup', {
    schema: {
      body: {
        type: 'object',
        required: ['method'],
        properties: {
          method: { type: 'string', enum: ['totp', 'sms'] },
          phone_number: { type: 'string' } // SMS용
        }
      }
    },
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const { method, phone_number } = request.body;
    const userId = request.user.user_id;
    const client = await pool.connect();
    
    try {
      if (method === 'totp') {
        // TOTP 비밀키 생성
        const secret = speakeasy.generateSecret({
          name: `Baro Calendar (${request.user.email})`,
          issuer: 'Baro Calendar',
          length: 32
        });
        
        // QR 코드 생성
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
        
        // 데이터베이스에 저장 (아직 verified=false)
        await client.query(`
          INSERT INTO two_factor_auth (user_id, method, secret, is_verified, is_enabled)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (user_id, method) 
          DO UPDATE SET secret = $3, is_verified = $4, is_enabled = $5, created_at = NOW()
        `, [userId, method, secret.base32, false, false]);
        
        reply.send({
          secret: secret.base32,
          qr_code: qrCodeUrl,
          backup_codes: [], // 검증 후 생성
          message: 'Scan QR code and verify with TOTP app'
        });
        
      } else if (method === 'sms') {
        if (!phone_number) {
          reply.code(400).send({ error: 'Phone number required for SMS 2FA' });
          return;
        }
        
        // SMS 비밀키 생성 (6자리 숫자)
        const smsSecret = Math.floor(100000 + Math.random() * 900000).toString();
        
        // 데이터베이스에 저장
        await client.query(`
          INSERT INTO two_factor_auth (user_id, method, secret, phone_number, is_verified, is_enabled)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (user_id, method) 
          DO UPDATE SET secret = $3, phone_number = $4, is_verified = $5, is_enabled = $6
        `, [userId, method, smsSecret, phone_number, false, false]);
        
        // SMS 발송
        if (twilioClient) {
          await twilioClient.messages.create({
            body: `Baro Calendar 2FA verification code: ${smsSecret}`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phone_number
          });
        }
        
        reply.send({
          message: 'SMS verification code sent',
          phone_number: phone_number.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
        });
      }
      
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: '2FA setup failed' });
    } finally {
      client.release();
    }
  });

  // POST /v1/auth/2fa/verify - 2FA 검증 및 활성화
  fastify.post('/2fa/verify', {
    schema: {
      body: {
        type: 'object',
        required: ['method', 'code'],
        properties: {
          method: { type: 'string', enum: ['totp', 'sms'] },
          code: { type: 'string' }
        }
      }
    },
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const { method, code } = request.body;
    const userId = request.user.user_id;
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 2FA 설정 조회
      const tfaResult = await client.query(`
        SELECT secret, phone_number 
        FROM two_factor_auth 
        WHERE user_id = $1 AND method = $2
      `, [userId, method]);
      
      if (tfaResult.rows.length === 0) {
        reply.code(404).send({ error: '2FA not set up' });
        return;
      }
      
      const tfa = tfaResult.rows[0];
      let isValid = false;
      
      if (method === 'totp') {
        // TOTP 검증
        isValid = speakeasy.totp.verify({
          secret: tfa.secret,
          encoding: 'base32',
          token: code,
          window: 2 // 시간 창 허용
        });
      } else if (method === 'sms') {
        // SMS 코드 검증
        isValid = (code === tfa.secret);
      }
      
      if (!isValid) {
        reply.code(401).send({ error: 'Invalid verification code' });
        return;
      }
      
      // 백업 코드 생성 (TOTP만)
      let backupCodes = [];
      if (method === 'totp') {
        backupCodes = Array.from({ length: 10 }, () => 
          Math.random().toString(36).substring(2, 10).toUpperCase()
        );
      }
      
      // 2FA 활성화
      await client.query(`
        UPDATE two_factor_auth 
        SET is_verified = TRUE, is_enabled = TRUE, verified_at = NOW(),
            backup_codes = $3
        WHERE user_id = $1 AND method = $2
      `, [userId, method, JSON.stringify(backupCodes)]);
      
      // users 테이블 업데이트
      await client.query(`
        UPDATE users 
        SET two_factor_enabled = TRUE 
        WHERE id = $1
      `, [userId]);
      
      // 로그 기록
      await client.query(`
        INSERT INTO auth_logs (user_id, event_type, metadata, created_at)
        VALUES ($1, '2fa_enabled', $2, NOW())
      `, [userId, JSON.stringify({ method })]);
      
      await client.query('COMMIT');
      
      reply.send({
        message: '2FA enabled successfully',
        backup_codes: method === 'totp' ? backupCodes : undefined
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      fastify.log.error(error);
      reply.code(500).send({ error: '2FA verification failed' });
    } finally {
      client.release();
    }
  });

  // 헬퍼 메서드들
  this.logAuthEvent = async (client, userId, email, eventType, request) => {
    await client.query(`
      INSERT INTO auth_logs (user_id, email, event_type, ip_address, user_agent, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `, [userId, email, eventType, request.ip, request.headers['user-agent']]);
  };
  
  this.verify2FA = async (client, userId, code) => {
    const tfaResult = await client.query(`
      SELECT method, secret, backup_codes 
      FROM two_factor_auth 
      WHERE user_id = $1 AND is_enabled = TRUE
    `, [userId]);
    
    if (tfaResult.rows.length === 0) return false;
    
    const tfa = tfaResult.rows[0];
    
    if (tfa.method === 'totp') {
      // TOTP 검증
      const isValid = speakeasy.totp.verify({
        secret: tfa.secret,
        encoding: 'base32',
        token: code,
        window: 2
      });
      
      // 백업 코드 확인
      if (!isValid && tfa.backup_codes) {
        const backupCodes = JSON.parse(tfa.backup_codes);
        const backupValid = backupCodes.includes(code.toUpperCase());
        
        if (backupValid) {
          // 사용된 백업 코드 제거
          const updatedCodes = backupCodes.filter(c => c !== code.toUpperCase());
          await client.query(`
            UPDATE two_factor_auth 
            SET backup_codes = $1 
            WHERE user_id = $2
          `, [JSON.stringify(updatedCodes), userId]);
          return true;
        }
      }
      
      return isValid;
    }
    
    return false;
  };
}

module.exports = authRoutes;