/**
 * 기본 테넌트 및 프로젝트 데이터 삽입 마이그레이션
 * 마이그레이션 ID: 002
 * 설명: 시스템 초기화를 위한 기본 데이터 삽입
 */

const { Pool } = require('pg');

// 데이터베이스 연결 설정
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'baro_calendar',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

/**
 * 기본 테넌트 데이터 삽입
 */
async function insertDefaultTenant() {
  const client = await pool.connect();
  
  try {
    // 기본 테넌트 데이터
    const defaultTenant = {
      name: 'Baro Calendar',
      domain: 'baro-calendar.com',
      settings: {
        timezone: 'Asia/Seoul',
        date_format: 'YYYY-MM-DD',
        time_format: 'HH:mm',
        week_start: 'monday',
        business_hours: {
          start: '09:00',
          end: '18:00'
        }
      },
<<<<<<< HEAD
    };

    const result = await client.query(`
      INSERT INTO tenants (name, domain, settings, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      ON CONFLICT (domain) DO UPDATE SET
        name = EXCLUDED.name,
        settings = EXCLUDED.settings,
=======
      status: 'active'
    };

    const result = await client.query(`
      INSERT INTO tenants (name, domain, settings, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      ON CONFLICT (domain) DO UPDATE SET
        name = EXCLUDED.name,
        settings = EXCLUDED.settings,
        status = EXCLUDED.status,
>>>>>>> 2b71f98b066ec7ed28857fc750a5e01cbb498291
        updated_at = NOW()
      RETURNING id, name, domain
    `, [
      defaultTenant.name,
      defaultTenant.domain,
<<<<<<< HEAD
      JSON.stringify(defaultTenant.settings)
=======
      JSON.stringify(defaultTenant.settings),
      defaultTenant.status
>>>>>>> 2b71f98b066ec7ed28857fc750a5e01cbb498291
    ]);

    console.log('✅ 기본 테넌트 생성 완료:', result.rows[0]);
    return result.rows[0];
    
  } catch (error) {
    console.error('❌ 기본 테넌트 생성 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 기본 사용자 데이터 삽입 (테스트용)
 */
async function insertDefaultUsers(tenantId) {
  const client = await pool.connect();
  
  try {
    // 기본 사용자 데이터
    const defaultUsers = [
      {
        email: 'admin@baro-calendar.com',
        first_name: '관리자',
        last_name: '김',
        role: 'admin',
        status: 'active'
      },
      {
        email: 'user1@baro-calendar.com',
        first_name: '사용자1',
        last_name: '이',
        role: 'user',
        status: 'active'
      },
      {
        email: 'user2@baro-calendar.com',
        first_name: '사용자2',
        last_name: '박',
        role: 'user',
        status: 'active'
      }
    ];

    const insertedUsers = [];
    
    for (const userData of defaultUsers) {
      const result = await client.query(`
        INSERT INTO users (email, password_hash, first_name, last_name, role, status, tenant_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        ON CONFLICT (email) DO UPDATE SET
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          role = EXCLUDED.role,
          status = EXCLUDED.status,
          updated_at = NOW()
        RETURNING id, email, first_name, last_name, role
      `, [
        userData.email,
        '$2b$10$dummy.hash.for.testing.purposes.only', // 테스트용 더미 해시
        userData.first_name,
        userData.last_name,
        userData.role,
        userData.status,
        tenantId
      ]);
      
      insertedUsers.push(result.rows[0]);
    }

    console.log('✅ 기본 사용자 생성 완료:', insertedUsers.length, '명');
    return insertedUsers;
    
  } catch (error) {
    console.error('❌ 기본 사용자 생성 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 샘플 프로젝트 데이터 생성
 */
async function insertSampleProjects(tenantId, users) {
  const client = await pool.connect();
  
  try {
    const adminUser = users.find(u => u.role === 'admin');
    const regularUser = users.find(u => u.role === 'user');
    
    if (!adminUser || !regularUser) {
      throw new Error('필요한 사용자 역할을 찾을 수 없습니다');
    }

    // 샘플 프로젝트 데이터
    const sampleProjects = [
      {
        name: '개인 일정 관리',
        description: '개인적인 일정과 할 일을 관리하는 프로젝트',
        color: '#4CAF50',
        owner_id: adminUser.id,
        settings: {
          default_view: 'month',
          show_weekends: true,
          working_hours: {
            start: '09:00',
            end: '18:00'
          }
        }
      },
      {
        name: '팀 프로젝트',
        description: '팀원들과 함께 진행하는 프로젝트 일정 관리',
        color: '#2196F3',
        owner_id: adminUser.id,
        settings: {
          default_view: 'week',
          show_weekends: false,
          working_hours: {
            start: '09:00',
            end: '18:00'
          }
        }
      },
      {
        name: '회의 일정',
        description: '회의 및 미팅 일정을 관리하는 프로젝트',
        color: '#FF9800',
        owner_id: regularUser.id,
        settings: {
          default_view: 'day',
          show_weekends: true,
          working_hours: {
            start: '09:00',
            end: '18:00'
          }
        }
      },
      {
        name: '마케팅 캠페인',
        description: '마케팅 캠페인 일정 및 마일스톤 관리',
        color: '#9C27B0',
        owner_id: adminUser.id,
        settings: {
          default_view: 'month',
          show_weekends: false,
          working_hours: {
            start: '09:00',
            end: '18:00'
          }
        }
      },
      {
        name: '개발 스프린트',
        description: '애자일 개발 스프린트 일정 관리',
        color: '#F44336',
        owner_id: regularUser.id,
        settings: {
          default_view: 'week',
          show_weekends: false,
          working_hours: {
            start: '09:00',
            end: '18:00'
          }
        }
      }
    ];

    const insertedProjects = [];
    
    for (const projectData of sampleProjects) {
      const result = await client.query(`
        INSERT INTO projects (name, description, color, tenant_id, owner_id, settings, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        ON CONFLICT (tenant_id, name) DO UPDATE SET
          description = EXCLUDED.description,
          color = EXCLUDED.color,
          settings = EXCLUDED.settings,
          updated_at = NOW()
        RETURNING id, name, description, color, owner_id
      `, [
        projectData.name,
        projectData.description,
        projectData.color,
        tenantId,
        projectData.owner_id,
        JSON.stringify(projectData.settings)
      ]);
      
      insertedProjects.push(result.rows[0]);
    }

    console.log('✅ 샘플 프로젝트 생성 완료:', insertedProjects.length, '개');
    return insertedProjects;
    
  } catch (error) {
    console.error('❌ 샘플 프로젝트 생성 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 프로젝트 멤버 데이터 생성
 */
async function insertProjectMembers(tenantId, projects, users) {
  const client = await pool.connect();
  
  try {
    const adminUser = users.find(u => u.role === 'admin');
    const regularUsers = users.filter(u => u.role === 'user');
    
    if (!adminUser || regularUsers.length === 0) {
      throw new Error('필요한 사용자 역할을 찾을 수 없습니다');
    }

    const insertedMembers = [];
    
    for (const project of projects) {
      // 프로젝트 소유자를 Owner로 추가
      const ownerMember = await client.query(`
        INSERT INTO members (tenant_id, project_id, user_id, role, invited_at, accepted_at, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW(), NOW(), NOW())
        ON CONFLICT (project_id, user_id) DO UPDATE SET
          role = EXCLUDED.role,
          updated_at = NOW()
        RETURNING id, project_id, user_id, role
      `, [
        tenantId,
        project.id,
        project.owner_id,
        'Owner'
      ]);
      
      insertedMembers.push(ownerMember.rows[0]);

      // 다른 사용자들을 Editor 또는 Viewer로 추가
      for (const user of regularUsers) {
        if (user.id !== project.owner_id) {
          const role = Math.random() > 0.5 ? 'Editor' : 'Viewer';
          
          const member = await client.query(`
            INSERT INTO members (tenant_id, project_id, user_id, role, invited_at, accepted_at, created_at, updated_at)
            VALUES ($1, $2, $3, $4, NOW(), NOW(), NOW(), NOW())
            ON CONFLICT (project_id, user_id) DO UPDATE SET
              role = EXCLUDED.role,
              updated_at = NOW()
            RETURNING id, project_id, user_id, role
          `, [
            tenantId,
            project.id,
            user.id,
            role
          ]);
          
          insertedMembers.push(member.rows[0]);
        }
      }
    }

    console.log('✅ 프로젝트 멤버 생성 완료:', insertedMembers.length, '명');
    return insertedMembers;
    
  } catch (error) {
    console.error('❌ 프로젝트 멤버 생성 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 마이그레이션 실행 (업)
 */
async function up() {
  console.log('🚀 기본 데이터 삽입 마이그레이션 시작...');
  
  try {
    // 1. 기본 테넌트 생성
    const tenant = await insertDefaultTenant();
    
    // 2. 기본 사용자 생성
    const users = await insertDefaultUsers(tenant.id);
    
    // 3. 샘플 프로젝트 생성
    const projects = await insertSampleProjects(tenant.id, users);
    
    // 4. 프로젝트 멤버 생성
    const members = await insertProjectMembers(tenant.id, projects, users);
    
    console.log('✅ 모든 기본 데이터 삽입 완료!');
    console.log(`📊 요약: 테넌트 ${1}개, 사용자 ${users.length}명, 프로젝트 ${projects.length}개, 멤버 ${members.length}명`);
    
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    throw error;
  }
}

/**
 * 마이그레이션 롤백 (다운)
 */
async function down() {
  console.log('🔄 기본 데이터 삽입 마이그레이션 롤백 시작...');
  
  const client = await pool.connect();
  
  try {
    // 기본 테넌트 삭제 (연관된 모든 데이터도 함께 삭제됨)
    await client.query(`
      DELETE FROM tenants WHERE domain = 'baro-calendar.com'
    `);
    
    console.log('✅ 기본 데이터 삽입 롤백 완료');
    
  } catch (error) {
    console.error('❌ 롤백 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// CLI 실행 지원
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'up') {
    up().then(() => {
      console.log('✅ 마이그레이션 완료');
      process.exit(0);
    }).catch((error) => {
      console.error('❌ 마이그레이션 실패:', error);
      process.exit(1);
    });
  } else if (command === 'down') {
    down().then(() => {
      console.log('✅ 롤백 완료');
      process.exit(0);
    }).catch((error) => {
      console.error('❌ 롤백 실패:', error);
      process.exit(1);
    });
  } else {
    console.log('사용법: node 002_insert_default_tenant_and_projects.js [up|down]');
    process.exit(1);
  }
}

module.exports = {
  up,
  down
};
