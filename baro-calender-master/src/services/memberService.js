const Member = require('../models/member');
const Project = require('../models/project');

class MemberService {
  /**
   * 멤버 초대
   * @param {Object} memberData - 멤버 데이터
   * @param {number} memberData.tenant_id - 테넌트 ID
   * @param {number} memberData.project_id - 프로젝트 ID
   * @param {number} memberData.user_id - 사용자 ID
   * @param {string} memberData.role - 역할 (Owner/Editor/Commenter/Viewer)
   * @returns {Object} 생성된 멤버
   */
  static async inviteMember(memberData) {
    try {
      // 프로젝트 존재 여부 확인
      const project = await Project.findById(memberData.project_id);
      if (!project) {
        throw new Error('Project not found');
      }

      // 이미 멤버인지 확인
      const existingMember = await Member.findByProjectAndUser(
        memberData.project_id, 
        memberData.user_id
      );
      
      if (existingMember) {
        throw new Error('User is already a member of this project');
      }

      // 멤버 생성
      const member = await Member.create(memberData);
      
      return member;
    } catch (error) {
      throw new Error(`Failed to invite member: ${error.message}`);
    }
  }

  /**
   * 프로젝트 멤버 목록 조회
   * @param {number} project_id - 프로젝트 ID
   * @param {number} limit - 조회 제한 수
   * @param {number} offset - 조회 시작 위치
   * @returns {Array} 멤버 목록
   */
  static async getProjectMembers(project_id, limit = 100, offset = 0) {
    try {
      // 프로젝트 존재 여부 확인
      const project = await Project.findById(project_id);
      if (!project) {
        throw new Error('Project not found');
      }

      return await Member.findByProjectId(project_id);
    } catch (error) {
      throw new Error(`Failed to get project members: ${error.message}`);
    }
  }

  /**
   * 사용자의 프로젝트 멤버십 조회
   * @param {number} user_id - 사용자 ID
   * @param {number} limit - 조회 제한 수
   * @param {number} offset - 조회 시작 위치
   * @returns {Array} 멤버십 목록
   */
  static async getUserMemberships(user_id, limit = 100, offset = 0) {
    try {
      return await Member.findByUserId(user_id);
    } catch (error) {
      throw new Error(`Failed to get user memberships: ${error.message}`);
    }
  }

  /**
   * 멤버 역할 변경
   * @param {number} project_id - 프로젝트 ID
   * @param {number} user_id - 사용자 ID
   * @param {string} newRole - 새로운 역할
   * @returns {Object} 업데이트된 멤버
   */
  static async updateMemberRole(project_id, user_id, newRole) {
    try {
      // 프로젝트 존재 여부 확인
      const project = await Project.findById(project_id);
      if (!project) {
        throw new Error('Project not found');
      }

      // 멤버 존재 여부 확인
      const member = await Member.findByProjectAndUser(project_id, user_id);
      if (!member) {
        throw new Error('Member not found');
      }

      // 소유자 역할 변경 방지
      if (member.role === 'Owner' && newRole !== 'Owner') {
        throw new Error('Cannot change owner role');
      }

      // 역할 업데이트
      const updatedMember = await Member.updateRole(member.id, newRole);
      
      return updatedMember;
    } catch (error) {
      throw new Error(`Failed to update member role: ${error.message}`);
    }
  }

  /**
   * 멤버 제거
   * @param {number} project_id - 프로젝트 ID
   * @param {number} user_id - 사용자 ID
   * @returns {Object} 제거된 멤버
   */
  static async removeMember(project_id, user_id) {
    try {
      // 프로젝트 존재 여부 확인
      const project = await Project.findById(project_id);
      if (!project) {
        throw new Error('Project not found');
      }

      // 멤버 존재 여부 확인
      const member = await Member.findByProjectAndUser(project_id, user_id);
      if (!member) {
        throw new Error('Member not found');
      }

      // 소유자 제거 방지
      if (member.role === 'Owner') {
        throw new Error('Cannot remove project owner');
      }

      // 멤버 제거
      const removedMember = await Member.deleteByProjectAndUser(project_id, user_id);
      
      return removedMember;
    } catch (error) {
      throw new Error(`Failed to remove member: ${error.message}`);
    }
  }

  /**
   * 멤버 역할 확인
   * @param {number} project_id - 프로젝트 ID
   * @param {number} user_id - 사용자 ID
   * @param {string} requiredRole - 필요한 역할
   * @returns {boolean} 권한 여부
   */
  static async hasRole(project_id, user_id, requiredRole) {
    try {
      return await Member.hasRole(project_id, user_id, requiredRole);
    } catch (error) {
      throw new Error(`Failed to check role: ${error.message}`);
    }
  }

  /**
   * 프로젝트 멤버 통계 조회
   * @param {number} project_id - 프로젝트 ID
   * @returns {Object} 멤버 통계
   */
  static async getMemberStats(project_id) {
    try {
      // 프로젝트 존재 여부 확인
      const project = await Project.findById(project_id);
      if (!project) {
        throw new Error('Project not found');
      }

      const totalMembers = await Member.countByProjectId(project_id);
      const members = await Member.findByProjectId(project_id);
      
      // 역할별 통계
      const roleStats = members.reduce((acc, member) => {
        acc[member.role] = (acc[member.role] || 0) + 1;
        return acc;
      }, {});

      return {
        project_id,
        total_members: totalMembers,
        role_distribution: roleStats,
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get member stats: ${error.message}`);
    }
  }

  /**
   * 멤버 검색
   * @param {number} project_id - 프로젝트 ID
   * @param {string} searchTerm - 검색어
   * @param {number} limit - 조회 제한 수
   * @param {number} offset - 조회 시작 위치
   * @returns {Array} 검색된 멤버 목록
   */
  static async searchMembers(project_id, searchTerm, limit = 50, offset = 0) {
    try {
      // 프로젝트 존재 여부 확인
      const project = await Project.findById(project_id);
      if (!project) {
        throw new Error('Project not found');
      }

      const allMembers = await Member.findByProjectId(project_id);
      
      // 간단한 검색 구현 (나중에 풀텍스트 검색으로 개선 가능)
      const filteredMembers = allMembers.filter(member => 
        member.user && (
          member.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.role.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      
      return filteredMembers.slice(offset, offset + limit);
    } catch (error) {
      throw new Error(`Failed to search members: ${error.message}`);
    }
  }

  /**
   * 멤버 일괄 초대
   * @param {number} project_id - 프로젝트 ID
   * @param {Array} memberList - 멤버 목록
   * @returns {Array} 생성된 멤버들
   */
  static async bulkInviteMembers(project_id, memberList) {
    try {
      // 프로젝트 존재 여부 확인
      const project = await Project.findById(project_id);
      if (!project) {
        throw new Error('Project not found');
      }

      const results = [];
      const errors = [];

      for (const memberData of memberList) {
        try {
          const member = await this.inviteMember({
            ...memberData,
            project_id
          });
          results.push(member);
        } catch (error) {
          errors.push({
            user_id: memberData.user_id,
            error: error.message
          });
        }
      }

      return {
        success: results,
        errors: errors,
        total_requested: memberList.length,
        total_success: results.length,
        total_errors: errors.length
      };
    } catch (error) {
      throw new Error(`Failed to bulk invite members: ${error.message}`);
    }
  }
}

module.exports = MemberService;
