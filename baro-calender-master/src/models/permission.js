/**
 * 권한 모델 및 역할 기반 권한 검증 로직
 */

// 역할 정의
const ROLES = {
  OWNER: 'Owner',
  EDITOR: 'Editor',
  COMMENTER: 'Commenter',
  VIEWER: 'Viewer'
};

// 역할별 권한 정의
const ROLE_PERMISSIONS = {
  [ROLES.OWNER]: {
    // 프로젝트 관리
    canManageProject: true,
    canDeleteProject: true,
    canTransferOwnership: true,
    
    // 멤버 관리
    canInviteMembers: true,
    canRemoveMembers: true,
    canChangeMemberRoles: true,
    
    // 콘텐츠 관리
    canCreateContent: true,
    canEditContent: true,
    canDeleteContent: true,
    canViewContent: true,
    
    // 설정 관리
    canManageSettings: true,
    canManageIntegrations: true
  },
  
  [ROLES.EDITOR]: {
    // 프로젝트 관리
    canManageProject: false,
    canDeleteProject: false,
    canTransferOwnership: false,
    
    // 멤버 관리
    canInviteMembers: true,
    canRemoveMembers: false,
    canChangeMemberRoles: false,
    
    // 콘텐츠 관리
    canCreateContent: true,
    canEditContent: true,
    canDeleteContent: true,
    canViewContent: true,
    
    // 설정 관리
    canManageSettings: false,
    canManageIntegrations: false
  },
  
  [ROLES.COMMENTER]: {
    // 프로젝트 관리
    canManageProject: false,
    canDeleteProject: false,
    canTransferOwnership: false,
    
    // 멤버 관리
    canInviteMembers: false,
    canRemoveMembers: false,
    canChangeMemberRoles: false,
    
    // 콘텐츠 관리
    canCreateContent: true,
    canEditContent: false,
    canDeleteContent: false,
    canViewContent: true,
    
    // 설정 관리
    canManageSettings: false,
    canManageIntegrations: false
  },
  
  [ROLES.VIEWER]: {
    // 프로젝트 관리
    canManageProject: false,
    canDeleteProject: false,
    canTransferOwnership: false,
    
    // 멤버 관리
    canInviteMembers: false,
    canRemoveMembers: false,
    canChangeMemberRoles: false,
    
    // 콘텐츠 관리
    canCreateContent: false,
    canEditContent: false,
    canDeleteContent: false,
    canViewContent: true,
    
    // 설정 관리
    canManageSettings: false,
    canManageIntegrations: false
  }
};

// 권한 검증 클래스
class PermissionChecker {
  /**
   * 사용자가 특정 권한을 가지고 있는지 확인
   * @param {string} userRole - 사용자 역할
   * @param {string} permission - 확인할 권한
   * @returns {boolean} 권한 여부
   */
  static hasPermission(userRole, permission) {
    if (!ROLE_PERMISSIONS[userRole]) {
      return false;
    }
    
    return ROLE_PERMISSIONS[userRole][permission] === true;
  }

  /**
   * 사용자가 여러 권한을 모두 가지고 있는지 확인
   * @param {string} userRole - 사용자 역할
   * @param {Array<string>} permissions - 확인할 권한 목록
   * @returns {boolean} 모든 권한 보유 여부
   */
  static hasAllPermissions(userRole, permissions) {
    return permissions.every(permission => this.hasPermission(userRole, permission));
  }

  /**
   * 사용자가 여러 권한 중 하나라도 가지고 있는지 확인
   * @param {string} userRole - 사용자 역할
   * @param {Array<string>} permissions - 확인할 권한 목록
   * @returns {boolean} 하나 이상의 권한 보유 여부
   */
  static hasAnyPermission(userRole, permissions) {
    return permissions.some(permission => this.hasPermission(userRole, permission));
  }

  /**
   * 역할이 유효한지 확인
   * @param {string} role - 확인할 역할
   * @returns {boolean} 유효한 역할 여부
   */
  static isValidRole(role) {
    return Object.values(ROLES).includes(role);
  }

  /**
   * 역할의 권한 수준을 비교
   * @param {string} role1 - 첫 번째 역할
   * @param {string} role2 - 두 번째 역할
   * @returns {number} 비교 결과 (-1: role1이 낮음, 0: 동일, 1: role1이 높음)
   */
  static compareRoleLevel(role1, role2) {
    const roleLevels = {
      [ROLES.OWNER]: 4,
      [ROLES.EDITOR]: 3,
      [ROLES.COMMENTER]: 2,
      [ROLES.VIEWER]: 1
    };
    
    const level1 = roleLevels[role1] || 0;
    const level2 = roleLevels[role2] || 0;
    
    if (level1 < level2) return -1;
    if (level1 > level2) return 1;
    return 0;
  }

  /**
   * 사용자가 다른 사용자의 역할을 변경할 수 있는지 확인
   * @param {string} currentUserRole - 현재 사용자 역할
   * @param {string} targetUserRole - 대상 사용자 역할
   * @param {string} newRole - 새로운 역할
   * @returns {boolean} 역할 변경 가능 여부
   */
  static canChangeRole(currentUserRole, targetUserRole, newRole) {
    // 소유자는 자신의 역할을 변경할 수 없음
    if (targetUserRole === ROLES.OWNER) {
      return false;
    }
    
    // 소유자만 다른 사용자의 역할을 소유자로 변경할 수 있음
    if (newRole === ROLES.OWNER && currentUserRole !== ROLES.OWNER) {
      return false;
    }
    
    // 현재 사용자가 대상 사용자보다 높은 권한을 가져야 함
    return this.compareRoleLevel(currentUserRole, targetUserRole) > 0;
  }

  /**
   * 사용자가 멤버를 제거할 수 있는지 확인
   * @param {string} currentUserRole - 현재 사용자 역할
   * @param {string} targetUserRole - 대상 사용자 역할
   * @returns {boolean} 멤버 제거 가능 여부
   */
  static canRemoveMember(currentUserRole, targetUserRole) {
    // 소유자는 제거할 수 없음
    if (targetUserRole === ROLES.OWNER) {
      return false;
    }
    
    // 현재 사용자가 대상 사용자보다 높은 권한을 가져야 함
    return this.compareRoleLevel(currentUserRole, targetUserRole) > 0;
  }

  /**
   * 사용자가 프로젝트를 삭제할 수 있는지 확인
   * @param {string} userRole - 사용자 역할
   * @returns {boolean} 프로젝트 삭제 가능 여부
   */
  static canDeleteProject(userRole) {
    return this.hasPermission(userRole, 'canDeleteProject');
  }

  /**
   * 사용자가 프로젝트 설정을 관리할 수 있는지 확인
   * @param {string} userRole - 사용자 역할
   * @returns {boolean} 설정 관리 가능 여부
   */
  static canManageSettings(userRole) {
    return this.hasPermission(userRole, 'canManageSettings');
  }

  /**
   * 사용자가 콘텐츠를 생성할 수 있는지 확인
   * @param {string} userRole - 사용자 역할
   * @returns {boolean} 콘텐츠 생성 가능 여부
   */
  static canCreateContent(userRole) {
    return this.hasPermission(userRole, 'canCreateContent');
  }

  /**
   * 사용자가 콘텐츠를 편집할 수 있는지 확인
   * @param {string} userRole - 사용자 역할
   * @returns {boolean} 콘텐츠 편집 가능 여부
   */
  static canEditContent(userRole) {
    return this.hasPermission(userRole, 'canEditContent');
  }

  /**
   * 사용자가 콘텐츠를 삭제할 수 있는지 확인
   * @param {string} userRole - 사용자 역할
   * @returns {boolean} 콘텐츠 삭제 가능 여부
   */
  static canDeleteContent(userRole) {
    return this.hasPermission(userRole, 'canDeleteContent');
  }

  /**
   * 사용자가 콘텐츠를 볼 수 있는지 확인
   * @param {string} userRole - 사용자 역할
   * @returns {boolean} 콘텐츠 조회 가능 여부
   */
  static canViewContent(userRole) {
    return this.hasPermission(userRole, 'canViewContent');
  }
}

module.exports = {
  ROLES,
  ROLE_PERMISSIONS,
  PermissionChecker
};
