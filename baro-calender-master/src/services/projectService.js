const { Project } = require('../models/project');
const Member = require('../models/member');

class ProjectService {
  /**
   * 프로젝트 생성
   * @param {Object} projectData - 프로젝트 데이터
   * @param {number} projectData.tenant_id - 테넌트 ID
   * @param {number} projectData.owner_id - 소유자 ID
   * @param {string} projectData.name - 프로젝트명
   * @param {string} projectData.color - 프로젝트 색상
   * @param {string} projectData.description - 프로젝트 설명
   * @param {Object} projectData.settings - 프로젝트 설정
   * @returns {Object} 생성된 프로젝트
   */
  static async createProject(projectData) {
    try {
      // 프로젝트 생성
      const project = await Project.create(projectData);
      
      // 프로젝트 소유자를 Owner 역할로 멤버에 추가
      await Member.create({
        tenant_id: projectData.tenant_id,
        project_id: project.id,
        user_id: projectData.owner_id,
        role: 'Owner'
      });
      
      return project;
    } catch (error) {
      throw new Error(`Failed to create project: ${error.message}`);
    }
  }

  /**
   * 프로젝트 조회 (ID로)
   * @param {number} id - 프로젝트 ID
   * @returns {Object|null} 프로젝트 정보
   */
  static async getProjectById(id) {
    try {
      return await Project.findById(id);
    } catch (error) {
      throw new Error(`Failed to get project: ${error.message}`);
    }
  }

  /**
   * 프로젝트 조회 (멤버 포함)
   * @param {number} id - 프로젝트 ID
   * @returns {Object|null} 프로젝트 정보 (멤버 포함)
   */
  static async getProjectWithMembers(id) {
    try {
      return await Project.findWithMembers(id);
    } catch (error) {
      throw new Error(`Failed to get project with members: ${error.message}`);
    }
  }

  /**
   * 테넌트별 프로젝트 목록 조회
   * @param {number} tenant_id - 테넌트 ID
   * @param {number} limit - 조회 제한 수
   * @param {number} offset - 조회 시작 위치
   * @returns {Array} 프로젝트 목록
   */
  static async getProjectsByTenant(tenant_id, limit = 20, offset = 0) {
    try {
      return await Project.findByTenantId(tenant_id, limit, offset);
    } catch (error) {
      throw new Error(`Failed to get projects by tenant: ${error.message}`);
    }
  }

  /**
   * 사용자별 프로젝트 목록 조회
   * @param {number} user_id - 사용자 ID
   * @param {number} limit - 조회 제한 수
   * @param {number} offset - 조회 시작 위치
   * @returns {Array} 프로젝트 목록
   */
  static async getProjectsByUser(user_id, limit = 100, offset = 0) {
    try {
      return await Project.findByOwnerId(user_id, limit, offset);
    } catch (error) {
      throw new Error(`Failed to get projects by user: ${error.message}`);
    }
  }

  /**
   * 프로젝트 수정
   * @param {number} id - 프로젝트 ID
   * @param {Object} updateData - 수정할 데이터
   * @returns {Object|null} 수정된 프로젝트
   */
  static async updateProject(id, updateData) {
    try {
      // 프로젝트 존재 여부 확인
      const existingProject = await Project.findById(id);
      if (!existingProject) {
        throw new Error('Project not found');
      }
      
      return await Project.update(id, updateData);
    } catch (error) {
      throw new Error(`Failed to update project: ${error.message}`);
    }
  }

  /**
   * 프로젝트 삭제
   * @param {number} id - 프로젝트 ID
   * @returns {Object|null} 삭제된 프로젝트
   */
  static async deleteProject(id) {
    try {
      // 프로젝트 존재 여부 확인
      const existingProject = await Project.findById(id);
      if (!existingProject) {
        throw new Error('Project not found');
      }
      
      // 멤버 수 확인
      const memberCount = await Member.countByProjectId(id);
      if (memberCount > 1) { // 소유자 제외하고 다른 멤버가 있는 경우
        throw new Error('Cannot delete project with active members');
      }
      
      // 프로젝트 삭제 (멤버는 CASCADE로 자동 삭제)
      return await Project.delete(id);
    } catch (error) {
      throw new Error(`Failed to delete project: ${error.message}`);
    }
  }

  /**
   * 프로젝트 통계 조회
   * @param {number} tenant_id - 테넌트 ID
   * @returns {Object} 프로젝트 통계
   */
  static async getProjectStats(tenant_id) {
    try {
      const totalProjects = await Project.countByTenantId(tenant_id);
      
      return {
        total_projects: totalProjects,
        tenant_id: tenant_id,
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get project stats: ${error.message}`);
    }
  }

  /**
   * 프로젝트 검색
   * @param {number} tenant_id - 테넌트 ID
   * @param {string} searchTerm - 검색어
   * @param {number} limit - 조회 제한 수
   * @param {number} offset - 조회 시작 위치
   * @returns {Array} 검색된 프로젝트 목록
   */
  static async searchProjects(tenant_id, searchTerm, limit = 100, offset = 0) {
    try {
      // 간단한 검색 구현 (나중에 풀텍스트 검색으로 개선 가능)
      const allProjects = await Project.findByTenantId(tenant_id, 1000, 0);
      
      const filteredProjects = allProjects.filter(project => 
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      
      return filteredProjects.slice(offset, offset + limit);
    } catch (error) {
      throw new Error(`Failed to search projects: ${error.message}`);
    }
  }
}

module.exports = ProjectService;
