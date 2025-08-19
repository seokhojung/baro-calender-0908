const { PermissionChecker } = require('../models/permission');
const Member = require('../models/member');
const JWTUtils = require('../utils/jwtUtils');

/**
 * ACL (Access Control List) 미들웨어
 * API 엔드포인트에 대한 권한 검증을 담당
 */

class ACLMiddleware {
  /**
   * 사용자 인증 미들웨어
   * JWT 토큰을 검증하고 사용자 정보를 request에 추가
   */
  static authenticateUser() {
    return async (request, reply) => {
      try {
        // Authorization 헤더에서 토큰 추출
        const authHeader = request.headers.authorization;
        const token = JWTUtils.extractTokenFromHeader(authHeader);
        
        if (!token) {
          reply.code(401).send({
            error: 'Unauthorized',
            message: 'No authentication token provided',
            code: 'MISSING_TOKEN'
          });
          return;
        }

        // JWT_SECRET 환경 변수 확인
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
          reply.code(500).send({
            error: 'Internal Server Error',
            message: 'JWT_SECRET not configured',
            code: 'JWT_CONFIG_ERROR'
          });
          return;
        }

        // 토큰 검증
        try {
          const decoded = JWTUtils.verifyToken(token, jwtSecret);
          
          // 토큰 만료 확인
          if (JWTUtils.isTokenExpired(token, jwtSecret)) {
            reply.code(401).send({
              error: 'Unauthorized',
              message: 'Authentication token has expired',
              code: 'TOKEN_EXPIRED'
            });
            return;
          }

          // 블랙리스트 확인
          const isBlacklisted = await JWTUtils.isTokenBlacklisted(token);
          if (isBlacklisted) {
            reply.code(401).send({
              error: 'Unauthorized',
              message: 'Authentication token has been revoked',
              code: 'TOKEN_REVOKED'
            });
            return;
          }

          // 사용자 정보를 request에 추가
          request.user = {
            id: decoded.userId || decoded.id,
            email: decoded.email,
            tenant_id: decoded.tenantId || decoded.tenant_id,
            role: decoded.role
          };

        } catch (jwtError) {
          reply.code(401).send({
            error: 'Unauthorized',
            message: 'Invalid authentication token',
            code: 'INVALID_TOKEN',
            details: process.env.NODE_ENV === 'development' ? jwtError.message : undefined
          });
          return;
        }
        
      } catch (error) {
        console.error('Authentication error:', error);
        reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Authentication process failed',
          code: 'AUTH_ERROR'
        });
      }
    };
  }

  /**
   * 프로젝트 멤버십 확인 미들웨어
   * 사용자가 특정 프로젝트의 멤버인지 확인
   */
  static requireProjectMembership() {
    return async (request, reply) => {
      try {
        const { project_id } = request.params;
        const { user } = request;
        
        if (!user) {
          reply.code(401).send({
            error: 'Unauthorized',
            message: 'User not authenticated'
          });
          return;
        }
        
        // 프로젝트 멤버십 확인
        const member = await Member.findByProjectAndUser(project_id, user.id);
        if (!member) {
          reply.code(403).send({
            error: 'Forbidden',
            message: 'User is not a member of this project'
          });
          return;
        }
        
        // 멤버 정보를 request에 추가
        request.member = member;
        request.userRole = member.role;
        
      } catch (error) {
        reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to verify project membership'
        });
      }
    };
  }

  /**
   * 특정 권한 요구 미들웨어
   * @param {string|Array<string>} requiredPermissions - 필요한 권한
   */
  static requirePermission(requiredPermissions) {
    return async (request, reply) => {
      try {
        const { userRole } = request;
        
        if (!userRole) {
          reply.code(403).send({
            error: 'Forbidden',
            message: 'User role not found'
          });
          return;
        }
        
        // 권한 확인
        let hasPermission = false;
        if (Array.isArray(requiredPermissions)) {
          hasPermission = PermissionChecker.hasAnyPermission(userRole, requiredPermissions);
        } else {
          hasPermission = PermissionChecker.hasPermission(userRole, requiredPermissions);
        }
        
        if (!hasPermission) {
          reply.code(403).send({
            error: 'Forbidden',
            message: 'Insufficient permissions for this operation'
          });
          return;
        }
        
      } catch (error) {
        reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to verify permissions'
        });
      }
    };
  }

  /**
   * 프로젝트 소유자만 접근 가능한 미들웨어
   */
  static requireProjectOwner() {
    return async (request, reply) => {
      try {
        const { userRole } = request;
        
        if (!userRole) {
          reply.code(403).send({
            error: 'Forbidden',
            message: 'User role not found'
          });
          return;
        }
        
        if (userRole !== 'Owner') {
          reply.code(403).send({
            error: 'Forbidden',
            message: 'Only project owners can perform this operation'
          });
          return;
        }
        
      } catch (error) {
        reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to verify project ownership'
        });
      }
    };
  }

  /**
   * 프로젝트 편집자 이상 권한 요구 미들웨어
   */
  static requireEditorOrHigher() {
    return async (request, reply) => {
      try {
        const { userRole } = request;
        
        if (!userRole) {
          reply.code(403).send({
            error: 'Forbidden',
            message: 'User role not found'
          });
          return;
        }
        
        const allowedRoles = ['Owner', 'Editor'];
        if (!allowedRoles.includes(userRole)) {
          reply.code(403).send({
            error: 'Forbidden',
            message: 'Editor or higher role required for this operation'
          });
          return;
        }
        
      } catch (error) {
        reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to verify editor permissions'
        });
      }
    };
  }

  /**
   * 프로젝트 뷰어 이상 권한 요구 미들웨어
   */
  static requireViewerOrHigher() {
    return async (request, reply) => {
      try {
        const { userRole } = request;
        
        if (!userRole) {
          reply.code(403).send({
            error: 'Forbidden',
            message: 'User role not found'
          });
          return;
        }
        
        // 모든 역할이 뷰어 이상이므로 추가 검증 불필요
        // 하지만 향후 확장성을 위해 미들웨어 유지
        
      } catch (error) {
        reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to verify viewer permissions'
        });
      }
    };
  }

  /**
   * 테넌트 멤버십 확인 미들웨어
   * 사용자가 특정 테넌트에 속해 있는지 확인
   */
  static requireTenantMembership() {
    return async (request, reply) => {
      try {
        const { user } = request;
        
        if (!user) {
          reply.code(401).send({
            error: 'Unauthorized',
            message: 'User not authenticated'
          });
          return;
        }
        
        // TODO: 실제 테넌트 멤버십 확인 로직 구현
        // const tenantMembership = await TenantMember.findByUserAndTenant(user.id, tenant_id);
        // if (!tenantMembership) {
        //   reply.code(403).send({
        //     error: 'Forbidden',
        //     message: 'User is not a member of this tenant'
        //   });
        //   return;
        // }
        
      } catch (error) {
        reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to verify tenant membership'
        });
      }
    };
  }

  /**
   * 역할 기반 권한 검증 미들웨어
   * @param {string} requiredRole - 필요한 최소 역할
   */
  static requireRole(requiredRole) {
    return async (request, reply) => {
      try {
        const { userRole } = request;
        
        if (!userRole) {
          reply.code(403).send({
            error: 'Forbidden',
            message: 'User role not found'
          });
          return;
        }
        
        // 역할 수준 비교
        const comparison = PermissionChecker.compareRoleLevel(userRole, requiredRole);
        if (comparison < 0) {
          reply.code(403).send({
            error: 'Forbidden',
            message: `Role '${requiredRole}' or higher required for this operation`
          });
          return;
        }
        
      } catch (error) {
        reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to verify role requirements'
        });
      }
    };
  }

  /**
   * 복합 권한 검증 미들웨어
   * 여러 조건을 동시에 검증
   */
  static requireAll(conditions) {
    return async (request, reply) => {
      try {
        for (const condition of conditions) {
          if (typeof condition === 'function') {
            await condition(request, reply);
          } else if (typeof condition === 'string') {
            await ACLMiddleware.requirePermission(condition)(request, reply);
          }
        }
      } catch (error) {
        reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to verify all conditions'
        });
      }
    };
  }

  /**
   * 선택적 권한 검증 미들웨어
   * 여러 조건 중 하나라도 만족하면 통과
   */
  static requireAny(conditions) {
    return async (request, reply) => {
      try {
        let hasAnyPermission = false;
        
        for (const condition of conditions) {
          try {
            if (typeof condition === 'function') {
              // 조건 함수 실행 (에러가 발생하지 않으면 통과)
              await condition(request, reply);
              hasAnyPermission = true;
              break;
            } else if (typeof condition === 'string') {
              // 권한 문자열 확인
              const { userRole } = request;
              if (PermissionChecker.hasPermission(userRole, condition)) {
                hasAnyPermission = true;
                break;
              }
            }
          } catch (error) {
            // 개별 조건 실패는 무시하고 계속 진행
            continue;
          }
        }
        
        if (!hasAnyPermission) {
          reply.code(403).send({
            error: 'Forbidden',
            message: 'None of the required permissions are satisfied'
          });
          return;
        }
        
      } catch (error) {
        reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to verify any conditions'
        });
      }
    };
  }
}

module.exports = ACLMiddleware;
