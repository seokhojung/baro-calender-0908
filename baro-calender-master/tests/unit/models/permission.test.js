/**
 * PermissionChecker 클래스 단위 테스트
 */

const { PermissionChecker, ROLES, ROLE_PERMISSIONS } = require('../../../src/models/permission');

describe('PermissionChecker', () => {
  describe('ROLES and ROLE_PERMISSIONS constants', () => {
    it('should have correct role definitions', () => {
      expect(ROLES).toEqual({
        OWNER: 'Owner',
        EDITOR: 'Editor',
        COMMENTER: 'Commenter',
        VIEWER: 'Viewer'
      });
    });

    it('should have permissions for all roles', () => {
      expect(ROLE_PERMISSIONS).toHaveProperty('Owner');
      expect(ROLE_PERMISSIONS).toHaveProperty('Editor');
      expect(ROLE_PERMISSIONS).toHaveProperty('Commenter');
      expect(ROLE_PERMISSIONS).toHaveProperty('Viewer');
    });

    it('should have Owner with all permissions', () => {
      const ownerPermissions = ROLE_PERMISSIONS[ROLES.OWNER];
      expect(ownerPermissions.canManageProject).toBe(true);
      expect(ownerPermissions.canDeleteProject).toBe(true);
      expect(ownerPermissions.canInviteMembers).toBe(true);
      expect(ownerPermissions.canCreateContent).toBe(true);
    });
  });

  describe('hasPermission', () => {
    it('should return true for valid permission', () => {
      expect(PermissionChecker.hasPermission('Owner', 'canManageProject')).toBe(true);
      expect(PermissionChecker.hasPermission('Editor', 'canInviteMembers')).toBe(true);
      expect(PermissionChecker.hasPermission('Commenter', 'canCreateContent')).toBe(true);
      expect(PermissionChecker.hasPermission('Viewer', 'canViewContent')).toBe(true);
    });

    it('should return false for invalid permission', () => {
      expect(PermissionChecker.hasPermission('Owner', 'invalidPermission')).toBe(false);
      expect(PermissionChecker.hasPermission('Editor', 'canDeleteProject')).toBe(false);
      expect(PermissionChecker.hasPermission('Commenter', 'canEditContent')).toBe(false);
      expect(PermissionChecker.hasPermission('Viewer', 'canCreateContent')).toBe(false);
    });

    it('should return false for invalid role', () => {
      expect(PermissionChecker.hasPermission('InvalidRole', 'canViewContent')).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true when user has all permissions', () => {
      const permissions = ['canViewContent', 'canCreateContent'];
      expect(PermissionChecker.hasAllPermissions('Owner', permissions)).toBe(true);
      expect(PermissionChecker.hasAllPermissions('Editor', permissions)).toBe(true);
    });

    it('should return false when user lacks any permission', () => {
      const permissions = ['canViewContent', 'canDeleteProject'];
      expect(PermissionChecker.hasAllPermissions('Editor', permissions)).toBe(false);
      expect(PermissionChecker.hasAllPermissions('Commenter', permissions)).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true when user has at least one permission', () => {
      const permissions = ['canViewContent', 'canDeleteProject'];
      expect(PermissionChecker.hasAnyPermission('Editor', permissions)).toBe(true);
      expect(PermissionChecker.hasAnyPermission('Commenter', permissions)).toBe(true);
    });

    it('should return false when user has no permissions', () => {
      const permissions = ['canDeleteProject', 'canManageProject'];
      expect(PermissionChecker.hasAnyPermission('Commenter', permissions)).toBe(false);
      expect(PermissionChecker.hasAnyPermission('Viewer', permissions)).toBe(false);
    });
  });

  describe('isValidRole', () => {
    it('should return true for valid roles', () => {
      expect(PermissionChecker.isValidRole('Owner')).toBe(true);
      expect(PermissionChecker.isValidRole('Editor')).toBe(true);
      expect(PermissionChecker.isValidRole('Commenter')).toBe(true);
      expect(PermissionChecker.isValidRole('Viewer')).toBe(true);
    });

    it('should return false for invalid roles', () => {
      expect(PermissionChecker.isValidRole('InvalidRole')).toBe(false);
      expect(PermissionChecker.isValidRole('admin')).toBe(false);
      expect(PermissionChecker.isValidRole('')).toBe(false);
      expect(PermissionChecker.isValidRole(null)).toBe(false);
    });
  });

  describe('compareRoleLevel', () => {
    it('should correctly compare role levels', () => {
      // Owner (4) > Editor (3)
      expect(PermissionChecker.compareRoleLevel('Owner', 'Editor')).toBe(1);
      expect(PermissionChecker.compareRoleLevel('Editor', 'Owner')).toBe(-1);
      
      // Editor (3) > Commenter (2)
      expect(PermissionChecker.compareRoleLevel('Editor', 'Commenter')).toBe(1);
      expect(PermissionChecker.compareRoleLevel('Commenter', 'Editor')).toBe(-1);
      
      // Commenter (2) > Viewer (1)
      expect(PermissionChecker.compareRoleLevel('Commenter', 'Viewer')).toBe(1);
      expect(PermissionChecker.compareRoleLevel('Viewer', 'Commenter')).toBe(-1);
    });

    it('should return 0 for same role levels', () => {
      expect(PermissionChecker.compareRoleLevel('Owner', 'Owner')).toBe(0);
      expect(PermissionChecker.compareRoleLevel('Editor', 'Editor')).toBe(0);
      expect(PermissionChecker.compareRoleLevel('Commenter', 'Commenter')).toBe(0);
      expect(PermissionChecker.compareRoleLevel('Viewer', 'Viewer')).toBe(0);
    });

    it('should handle invalid roles', () => {
      expect(PermissionChecker.compareRoleLevel('InvalidRole', 'Owner')).toBe(-1);
      expect(PermissionChecker.compareRoleLevel('Owner', 'InvalidRole')).toBe(1);
    });
  });

  describe('canChangeRole', () => {
    it('should allow Owner to change other roles', () => {
      expect(PermissionChecker.canChangeRole('Owner', 'Editor', 'Commenter')).toBe(true);
      expect(PermissionChecker.canChangeRole('Owner', 'Commenter', 'Viewer')).toBe(true);
    });

    it('should not allow changing Owner role', () => {
      expect(PermissionChecker.canChangeRole('Owner', 'Owner', 'Editor')).toBe(false);
      expect(PermissionChecker.canChangeRole('Editor', 'Owner', 'Commenter')).toBe(false);
    });

    it('should not allow non-Owner to promote to Owner', () => {
      expect(PermissionChecker.canChangeRole('Editor', 'Commenter', 'Owner')).toBe(false);
      expect(PermissionChecker.canChangeRole('Commenter', 'Viewer', 'Owner')).toBe(false);
    });

    it('should require higher role level to change roles', () => {
      expect(PermissionChecker.canChangeRole('Editor', 'Commenter', 'Viewer')).toBe(true);
      expect(PermissionChecker.canChangeRole('Commenter', 'Viewer', 'Commenter')).toBe(true);
    });
  });

  describe('canRemoveMember', () => {
    it('should allow Owner to remove any non-Owner member', () => {
      expect(PermissionChecker.canRemoveMember('Owner', 'Editor')).toBe(true);
      expect(PermissionChecker.canRemoveMember('Owner', 'Commenter')).toBe(true);
      expect(PermissionChecker.canRemoveMember('Owner', 'Viewer')).toBe(true);
    });

    it('should not allow removing Owner', () => {
      expect(PermissionChecker.canRemoveMember('Owner', 'Owner')).toBe(false);
      expect(PermissionChecker.canRemoveMember('Editor', 'Owner')).toBe(false);
    });

    it('should require higher role level to remove members', () => {
      expect(PermissionChecker.canRemoveMember('Editor', 'Commenter')).toBe(true);
      expect(PermissionChecker.canRemoveMember('Commenter', 'Viewer')).toBe(true);
    });
  });

  describe('canDeleteProject', () => {
    it('should only allow Owner to delete projects', () => {
      expect(PermissionChecker.canDeleteProject('Owner')).toBe(true);
      expect(PermissionChecker.canDeleteProject('Editor')).toBe(false);
      expect(PermissionChecker.canDeleteProject('Commenter')).toBe(false);
      expect(PermissionChecker.canDeleteProject('Viewer')).toBe(false);
    });
  });

  describe('canManageSettings', () => {
    it('should only allow Owner to manage settings', () => {
      expect(PermissionChecker.canManageSettings('Owner')).toBe(true);
      expect(PermissionChecker.canManageSettings('Editor')).toBe(false);
      expect(PermissionChecker.canManageSettings('Commenter')).toBe(false);
      expect(PermissionChecker.canManageSettings('Viewer')).toBe(false);
    });
  });

  describe('Content permissions', () => {
    it('should have correct content creation permissions', () => {
      expect(PermissionChecker.canCreateContent('Owner')).toBe(true);
      expect(PermissionChecker.canCreateContent('Editor')).toBe(true);
      expect(PermissionChecker.canCreateContent('Commenter')).toBe(true);
      expect(PermissionChecker.canCreateContent('Viewer')).toBe(false);
    });

    it('should have correct content editing permissions', () => {
      expect(PermissionChecker.canEditContent('Owner')).toBe(true);
      expect(PermissionChecker.canEditContent('Editor')).toBe(true);
      expect(PermissionChecker.canEditContent('Commenter')).toBe(false);
      expect(PermissionChecker.canEditContent('Viewer')).toBe(false);
    });

    it('should have correct content deletion permissions', () => {
      expect(PermissionChecker.canDeleteContent('Owner')).toBe(true);
      expect(PermissionChecker.canDeleteContent('Editor')).toBe(true);
      expect(PermissionChecker.canDeleteContent('Commenter')).toBe(false);
      expect(PermissionChecker.canDeleteContent('Viewer')).toBe(false);
    });

    it('should have correct content viewing permissions', () => {
      expect(PermissionChecker.canViewContent('Owner')).toBe(true);
      expect(PermissionChecker.canViewContent('Editor')).toBe(true);
      expect(PermissionChecker.canViewContent('Commenter')).toBe(true);
      expect(PermissionChecker.canViewContent('Viewer')).toBe(true);
    });
  });

  describe('Member management permissions', () => {
    it('should have correct member invitation permissions', () => {
      expect(PermissionChecker.hasPermission('Owner', 'canInviteMembers')).toBe(true);
      expect(PermissionChecker.hasPermission('Editor', 'canInviteMembers')).toBe(true);
      expect(PermissionChecker.hasPermission('Commenter', 'canInviteMembers')).toBe(false);
      expect(PermissionChecker.hasPermission('Viewer', 'canInviteMembers')).toBe(false);
    });

    it('should have correct member removal permissions', () => {
      expect(PermissionChecker.hasPermission('Owner', 'canRemoveMembers')).toBe(true);
      expect(PermissionChecker.hasPermission('Editor', 'canRemoveMembers')).toBe(false);
      expect(PermissionChecker.hasPermission('Commenter', 'canRemoveMembers')).toBe(false);
      expect(PermissionChecker.hasPermission('Viewer', 'canRemoveMembers')).toBe(false);
    });

    it('should have correct role change permissions', () => {
      expect(PermissionChecker.hasPermission('Owner', 'canChangeMemberRoles')).toBe(true);
      expect(PermissionChecker.hasPermission('Editor', 'canChangeMemberRoles')).toBe(false);
      expect(PermissionChecker.hasPermission('Commenter', 'canChangeMemberRoles')).toBe(false);
      expect(PermissionChecker.hasPermission('Viewer', 'canChangeMemberRoles')).toBe(false);
    });
  });
});
