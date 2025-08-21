const { PermissionChecker } = require('../models/permission');

/**
 * 권한 검증 유틸리티 함수들
 */

/**
 * 사용자가 프로젝트에 대한 특정 작업을 수행할 수 있는지 확인
 * @param {string} userRole - 사용자 역할
 * @param {string} action - 수행하려는 작업
 * @param {Object} context - 작업 컨텍스트 (예: 대상 사용자 역할)
 * @returns {boolean} 작업 수행 가능 여부
 */
function canPerformAction(userRole, action, context = {}) {
  switch (action) {
    case 'delete_project':
      return PermissionChecker.canDeleteProject(userRole);
    
    case 'manage_settings':
      return PermissionChecker.canManageSettings(userRole);
    
    case 'invite_members':
      return PermissionChecker.hasPermission(userRole, 'canInviteMembers');
    
    case 'remove_members':
      if (context.targetUserRole) {
        return PermissionChecker.canRemoveMember(userRole, context.targetUserRole);
      }
      return PermissionChecker.hasPermission(userRole, 'canRemoveMembers');
    
    case 'change_member_role':
      if (context.targetUserRole && context.newRole) {
        return PermissionChecker.canChangeRole(userRole, context.targetUserRole, context.newRole);
      }
      return PermissionChecker.hasPermission(userRole, 'canChangeMemberRoles');
    
    case 'create_content':
      return PermissionChecker.canCreateContent(userRole);
    
    case 'edit_content':
      return PermissionChecker.canEditContent(userRole);
    
    case 'delete_content':
      return PermissionChecker.canDeleteContent(userRole);
    
    case 'view_content':
      return PermissionChecker.canViewContent(userRole);
    
    default:
      return false;
  }
}

/**
 * 사용자가 프로젝트에 대한 읽기 권한을 가지고 있는지 확인
 * @param {string} userRole - 사용자 역할
 * @returns {boolean} 읽기 권한 여부
 */
function canReadProject(userRole) {
  return PermissionChecker.hasPermission(userRole, 'canViewContent');
}

/**
 * 사용자가 프로젝트에 대한 쓰기 권한을 가지고 있는지 확인
 * @param {string} userRole - 사용자 역할
 * @returns {boolean} 쓰기 권한 여부
 */
function canWriteProject(userRole) {
  return PermissionChecker.hasPermission(userRole, 'canCreateContent') ||
         PermissionChecker.hasPermission(userRole, 'canEditContent');
}

/**
 * 사용자가 프로젝트에 대한 관리 권한을 가지고 있는지 확인
 * @param {string} userRole - 사용자 역할
 * @returns {boolean} 관리 권한 여부
 */
function canManageProject(userRole) {
  return PermissionChecker.hasPermission(userRole, 'canManageProject');
}

/**
 * 사용자가 프로젝트에 대한 삭제 권한을 가지고 있는지 확인
 * @param {string} userRole - 사용자 역할
 * @returns {boolean} 삭제 권한 여부
 */
function canDeleteProject(userRole) {
  return PermissionChecker.canDeleteProject(userRole);
}

/**
 * 사용자가 멤버 관리 권한을 가지고 있는지 확인
 * @param {string} userRole - 사용자 역할
 * @returns {boolean} 멤버 관리 권한 여부
 */
function canManageMembers(userRole) {
  return PermissionChecker.hasPermission(userRole, 'canInviteMembers') ||
         PermissionChecker.hasPermission(userRole, 'canRemoveMembers') ||
         PermissionChecker.hasPermission(userRole, 'canChangeMemberRoles');
}

/**
 * 사용자가 설정 관리 권한을 가지고 있는지 확인
 * @param {string} userRole - 사용자 역할
 * @returns {boolean} 설정 관리 권한 여부
 */
function canManageSettings(userRole) {
  return PermissionChecker.canManageSettings(userRole);
}

/**
 * 사용자가 통합 관리 권한을 가지고 있는지 확인
 * @param {string} userRole - 사용자 역할
 * @returns {boolean} 통합 관리 권한 여부
 */
function canManageIntegrations(userRole) {
  return PermissionChecker.hasPermission(userRole, 'canManageIntegrations');
}

/**
 * 사용자가 소유권 이전 권한을 가지고 있는지 확인
 * @param {string} userRole - 사용자 역할
 * @returns {boolean} 소유권 이전 권한 여부
 */
function canTransferOwnership(userRole) {
  return PermissionChecker.hasPermission(userRole, 'canTransferOwnership');
}

/**
 * 역할 기반 권한 수준을 숫자로 반환
 * @param {string} role - 사용자 역할
 * @returns {number} 권한 수준 (1-4, 높을수록 권한이 높음)
 */
function getRoleLevel(role) {
  const roleLevels = {
    'Owner': 4,
    'Editor': 3,
    'Commenter': 2,
    'Viewer': 1
  };
  
  return roleLevels[role] || 0;
}

/**
 * 사용자가 특정 역할 이상의 권한을 가지고 있는지 확인
 * @param {string} userRole - 사용자 역할
 * @param {string} minimumRole - 최소 필요한 역할
 * @returns {boolean} 최소 권한 보유 여부
 */
function hasMinimumRole(userRole, minimumRole) {
  const userLevel = getRoleLevel(userRole);
  const minimumLevel = getRoleLevel(minimumRole);
  
  return userLevel >= minimumLevel;
}

/**
 * 사용자가 특정 역할과 정확히 일치하는지 확인
 * @param {string} userRole - 사용자 역할
 * @param {string} requiredRole - 필요한 역할
 * @returns {boolean} 역할 일치 여부
 */
function hasExactRole(userRole, requiredRole) {
  return userRole === requiredRole;
}

/**
 * 사용자가 허용된 역할 중 하나인지 확인
 * @param {string} userRole - 사용자 역할
 * @param {Array<string>} allowedRoles - 허용된 역할 목록
 * @returns {boolean} 허용된 역할 여부
 */
function hasAllowedRole(userRole, allowedRoles) {
  return allowedRoles.includes(userRole);
}

/**
 * 권한 검증 결과를 객체로 반환
 * @param {string} userRole - 사용자 역할
 * @param {string} action - 수행하려는 작업
 * @param {Object} context - 작업 컨텍스트
 * @returns {Object} 권한 검증 결과
 */
function validatePermission(userRole, action, context = {}) {
  const hasPermission = canPerformAction(userRole, action, context);
  const roleLevel = getRoleLevel(userRole);
  
  return {
    hasPermission,
    roleLevel,
    userRole,
    action,
    context,
    timestamp: new Date().toISOString()
  };
}

/**
 * 여러 권한을 한 번에 검증하고 결과를 반환
 * @param {string} userRole - 사용자 역할
 * @param {Array<string>} actions - 검증할 작업 목록
 * @param {Object} context - 작업 컨텍스트
 * @returns {Object} 권한 검증 결과 요약
 */
function validateMultiplePermissions(userRole, actions, context = {}) {
  const results = {};
  let totalActions = actions.length;
  let allowedActions = 0;
  
  for (const action of actions) {
    const result = validatePermission(userRole, action, context);
    results[action] = result;
    
    if (result.hasPermission) {
      allowedActions++;
    }
  }
  
  return {
    userRole,
    totalActions,
    allowedActions,
    deniedActions: totalActions - allowedActions,
    permissionRate: allowedActions / totalActions,
    results,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  canPerformAction,
  canReadProject,
  canWriteProject,
  canManageProject,
  canDeleteProject,
  canManageMembers,
  canManageSettings,
  canManageIntegrations,
  canTransferOwnership,
  getRoleLevel,
  hasMinimumRole,
  hasExactRole,
  hasAllowedRole,
  validatePermission,
  validateMultiplePermissions
};
