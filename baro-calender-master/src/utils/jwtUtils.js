const jwt = require('jsonwebtoken');

/**
 * JWT 토큰 관련 유틸리티 함수들
 */

class JWTUtils {
  /**
   * JWT 토큰 생성
   * @param {Object} payload - 토큰에 포함할 데이터
   * @param {string} secret - JWT 시크릿 키
   * @param {Object} options - JWT 옵션
   * @returns {string} JWT 토큰
   */
  static generateToken(payload, secret, options = {}) {
    const defaultOptions = {
      expiresIn: '24h',
      issuer: 'baro-calendar',
      audience: 'baro-calendar-users'
    };
    
    const finalOptions = { ...defaultOptions, ...options };
    
    return jwt.sign(payload, secret, finalOptions);
  }

  /**
   * JWT 토큰 검증
   * @param {string} token - 검증할 JWT 토큰
   * @param {string} secret - JWT 시크릿 키
   * @returns {Object} 검증된 토큰 페이로드
   */
  static verifyToken(token, secret) {
    try {
      return jwt.verify(token, secret);
    } catch (error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }

  /**
   * 토큰에서 사용자 ID 추출
   * @param {string} token - JWT 토큰
   * @param {string} secret - JWT 시크릿 키
   * @returns {string} 사용자 ID
   */
  static extractUserId(token, secret) {
    const decoded = this.verifyToken(token, secret);
    return decoded.userId || decoded.id;
  }

  /**
   * 토큰 만료 시간 확인
   * @param {string} token - JWT 토큰
   * @param {string} secret - JWT 시크릿 키
   * @returns {boolean} 만료 여부
   */
  static isTokenExpired(token, secret) {
    try {
      const decoded = this.verifyToken(token, secret);
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true; // 검증 실패 시 만료된 것으로 간주
    }
  }

  /**
   * 토큰 갱신
   * @param {string} token - 기존 JWT 토큰
   * @param {string} secret - JWT 시크릿 키
   * @param {Object} newPayload - 새로운 페이로드 (선택사항)
   * @returns {string} 새로운 JWT 토큰
   */
  static refreshToken(token, secret, newPayload = {}) {
    try {
      const decoded = this.verifyToken(token, secret);
      
      // 기존 페이로드에서 민감한 정보 제거
      const { exp, iat, ...safePayload } = decoded;
      
      // 새로운 페이로드와 병합
      const payload = { ...safePayload, ...newPayload };
      
      return this.generateToken(payload, secret);
    } catch (error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  /**
   * Authorization 헤더에서 토큰 추출
   * @param {string} authHeader - Authorization 헤더 값
   * @returns {string|null} JWT 토큰 또는 null
   */
  static extractTokenFromHeader(authHeader) {
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }
    
    return parts[1];
  }

  /**
   * 토큰 블랙리스트 확인 (Redis 연동 예정)
   * @param {string} token - 확인할 JWT 토큰
   * @returns {boolean} 블랙리스트 여부
   */
  static async isTokenBlacklisted(token) {
    // TODO: Redis 연동하여 블랙리스트 확인
    // 현재는 항상 false 반환
    return false;
  }

  /**
   * 토큰을 블랙리스트에 추가 (Redis 연동 예정)
   * @param {string} token - 블랙리스트에 추가할 JWT 토큰
   * @param {number} ttl - TTL (초)
   */
  static async addToBlacklist(token, ttl = 86400) {
    // TODO: Redis 연동하여 블랙리스트에 추가
    console.log(`Token added to blacklist with TTL: ${ttl}s`);
  }
}

module.exports = JWTUtils;
