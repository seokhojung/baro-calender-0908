const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'baro_calendar',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// OAuth Routes
async function oauthRoutes(fastify, options) {
  
  // Google OAuth 설정
  fastify.register(require('@fastify/oauth2'), {
    name: 'googleOAuth2',
    credentials: {
      client: {
        id: process.env.GOOGLE_CLIENT_ID,
        secret: process.env.GOOGLE_CLIENT_SECRET
      },
      auth: {
        authorizeHost: 'https://accounts.google.com',
        authorizePath: '/o/oauth2/v2/auth',
        tokenHost: 'https://www.googleapis.com',
        tokenPath: '/oauth2/v4/token'
      }
    },
    startRedirectPath: '/auth/google',
    callbackUri: `${process.env.BASE_URL || 'http://localhost:3000'}/v1/oauth/google/callback`,
    scope: ['profile', 'email'],
    generateStateFunction: () => {
      return require('crypto').randomBytes(32).toString('hex');
    },
    checkStateFunction: (state, callback) => {
      // 간단한 state 검증 (실제로는 Redis에 저장하여 검증)
      callback();
    }
  });

  // GitHub OAuth 설정  
  fastify.register(require('@fastify/oauth2'), {
    name: 'githubOAuth2',
    credentials: {
      client: {
        id: process.env.GITHUB_CLIENT_ID,
        secret: process.env.GITHUB_CLIENT_SECRET
      },
      auth: {
        authorizeHost: 'https://github.com',
        authorizePath: '/login/oauth/authorize',
        tokenHost: 'https://github.com',
        tokenPath: '/login/oauth/access_token'
      }
    },
    startRedirectPath: '/auth/github',
    callbackUri: `${process.env.BASE_URL || 'http://localhost:3000'}/v1/oauth/github/callback`,
    scope: ['user:email'],
    generateStateFunction: () => {
      return require('crypto').randomBytes(32).toString('hex');
    },
    checkStateFunction: (state, callback) => {
      callback();
    }
  });

  // Google OAuth 콜백
  fastify.get('/google/callback', async (request, reply) => {
    try {
      const { token } = await fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
      
      // Google API로 사용자 정보 가져오기
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${token.access_token}`
        }
      });
      
      const googleUser = await response.json();
      
      const result = await this.handleOAuthLogin({
        provider: 'google',
        providerId: googleUser.id,
        email: googleUser.email,
        name: googleUser.name,
        avatar: googleUser.picture,
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiresAt: token.expires_at ? new Date(token.expires_at * 1000) : null
      }, request);
      
      if (result.success) {
        // 프론트엔드로 리다이렉트 (토큰과 함께)
        const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/auth/callback?token=${result.access_token}&provider=google`;
        reply.redirect(redirectUrl);
      } else {
        reply.code(400).send({ error: result.error });
      }
      
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Google OAuth failed' });
    }
  });

  // GitHub OAuth 콜백
  fastify.get('/github/callback', async (request, reply) => {
    try {
      const { token } = await fastify.githubOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
      
      // GitHub API로 사용자 정보 가져오기
      const [userResponse, emailResponse] = await Promise.all([
        fetch('https://api.github.com/user', {
          headers: {
            'Authorization': `Bearer ${token.access_token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }),
        fetch('https://api.github.com/user/emails', {
          headers: {
            'Authorization': `Bearer ${token.access_token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        })
      ]);
      
      const githubUser = await userResponse.json();
      const emails = await emailResponse.json();
      const primaryEmail = emails.find(email => email.primary)?.email;
      
      const result = await this.handleOAuthLogin({
        provider: 'github',
        providerId: githubUser.id.toString(),
        email: primaryEmail || githubUser.email,
        name: githubUser.name || githubUser.login,
        avatar: githubUser.avatar_url,
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiresAt: null // GitHub tokens don't expire
      }, request);
      
      if (result.success) {
        const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/auth/callback?token=${result.access_token}&provider=github`;
        reply.redirect(redirectUrl);
      } else {
        reply.code(400).send({ error: result.error });
      }
      
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'GitHub OAuth failed' });
    }
  });

  // OAuth 연결 해제
  fastify.delete('/disconnect/:provider', {
    schema: {
      params: {
        type: 'object',
        properties: {
          provider: { type: 'string', enum: ['google', 'github'] }
        }
      }
    },
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const { provider } = request.params;
    const userId = request.user.user_id;
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // OAuth 연결 확인
      const oauthResult = await client.query(`
        SELECT id FROM oauth_providers 
        WHERE user_id = $1 AND provider = $2
      `, [userId, provider]);
      
      if (oauthResult.rows.length === 0) {
        reply.code(404).send({ error: 'OAuth connection not found' });
        return;
      }
      
      // 사용자가 password를 가지고 있는지 확인 (OAuth만으로 가입한 경우 보호)
      const userResult = await client.query(`
        SELECT password_hash, oauth_only FROM users WHERE id = $1
      `, [userId]);
      
      const user = userResult.rows[0];
      
      if (user.oauth_only && !user.password_hash) {
        reply.code(400).send({ 
          error: 'Cannot disconnect only authentication method',
          message: 'Please set a password first'
        });
        return;
      }
      
      // OAuth 연결 삭제
      await client.query(`
        DELETE FROM oauth_providers 
        WHERE user_id = $1 AND provider = $2
      `, [userId, provider]);
      
      // 로그 기록
      await client.query(`
        INSERT INTO auth_logs (user_id, event_type, metadata, created_at)
        VALUES ($1, 'oauth_disconnect', $2, NOW())
      `, [userId, JSON.stringify({ provider })]);
      
      await client.query('COMMIT');
      
      reply.send({ message: `${provider} disconnected successfully` });
      
    } catch (error) {
      await client.query('ROLLBACK');
      fastify.log.error(error);
      reply.code(500).send({ error: 'OAuth disconnect failed' });
    } finally {
      client.release();
    }
  });

  // 연결된 OAuth 계정 조회
  fastify.get('/connections', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const userId = request.user.user_id;
    
    try {
      const result = await pool.query(`
        SELECT provider, provider_email, provider_name, created_at
        FROM oauth_providers 
        WHERE user_id = $1
        ORDER BY created_at DESC
      `, [userId]);
      
      reply.send({ connections: result.rows });
      
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to fetch connections' });
    }
  });

  // OAuth 로그인 처리 헬퍼 함수
  this.handleOAuthLogin = async (oauthData, request) => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      let user;
      let isNewUser = false;
      
      // 기존 OAuth 연결 확인
      const oauthResult = await client.query(`
        SELECT u.id, u.email, u.name, u.two_factor_enabled
        FROM oauth_providers op
        JOIN users u ON u.id = op.user_id
        WHERE op.provider = $1 AND op.provider_user_id = $2
      `, [oauthData.provider, oauthData.providerId]);
      
      if (oauthResult.rows.length > 0) {
        // 기존 사용자 - OAuth 토큰 업데이트
        user = oauthResult.rows[0];
        
        await client.query(`
          UPDATE oauth_providers 
          SET access_token = $1, refresh_token = $2, expires_at = $3,
              provider_email = $4, provider_name = $5, provider_avatar = $6,
              updated_at = NOW()
          WHERE provider = $7 AND provider_user_id = $8
        `, [
          oauthData.accessToken, oauthData.refreshToken, oauthData.expiresAt,
          oauthData.email, oauthData.name, oauthData.avatar,
          oauthData.provider, oauthData.providerId
        ]);
        
      } else {
        // 이메일로 기존 사용자 확인
        const userResult = await client.query(`
          SELECT id, email, name, two_factor_enabled FROM users WHERE email = $1
        `, [oauthData.email]);
        
        if (userResult.rows.length > 0) {
          // 기존 사용자에게 OAuth 연결 추가
          user = userResult.rows[0];
          
          await client.query(`
            INSERT INTO oauth_providers (
              user_id, provider, provider_user_id, provider_email, provider_name,
              provider_avatar, access_token, refresh_token, expires_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `, [
            user.id, oauthData.provider, oauthData.providerId,
            oauthData.email, oauthData.name, oauthData.avatar,
            oauthData.accessToken, oauthData.refreshToken, oauthData.expiresAt
          ]);
          
        } else {
          // 새 사용자 생성
          const newUserResult = await client.query(`
            INSERT INTO users (
              email, name, email_verified, oauth_only, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, NOW(), NOW())
            RETURNING id, email, name, two_factor_enabled
          `, [oauthData.email, oauthData.name, true, true]);
          
          user = newUserResult.rows[0];
          isNewUser = true;
          
          // OAuth 연결 생성
          await client.query(`
            INSERT INTO oauth_providers (
              user_id, provider, provider_user_id, provider_email, provider_name,
              provider_avatar, access_token, refresh_token, expires_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `, [
            user.id, oauthData.provider, oauthData.providerId,
            oauthData.email, oauthData.name, oauthData.avatar,
            oauthData.accessToken, oauthData.refreshToken, oauthData.expiresAt
          ]);
        }
      }
      
      // JWT 토큰 생성
      const tokenPayload = {
        user_id: user.id,
        email: user.email,
        name: user.name
      };
      
      const accessToken = fastify.jwt.sign(tokenPayload, { expiresIn: '1h' });
      const refreshToken = fastify.jwt.sign(tokenPayload, { expiresIn: '30d' });
      
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
        new Date(Date.now() + 60 * 60 * 1000) // 1시간
      ]);
      
      // 로그 기록
      await client.query(`
        INSERT INTO auth_logs (user_id, email, event_type, provider, ip_address, user_agent, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [user.id, user.email, 'oauth_login', oauthData.provider, request.ip, request.headers['user-agent']]);
      
      await client.query('COMMIT');
      
      return {
        success: true,
        access_token: accessToken,
        refresh_token: refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          two_factor_enabled: user.two_factor_enabled
        },
        is_new_user: isNewUser
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      fastify.log.error(error);
      return { success: false, error: 'OAuth login failed' };
    } finally {
      client.release();
    }
  };
}

module.exports = oauthRoutes;