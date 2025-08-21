const fastify = require('fastify');
const ProjectService = require('../../services/projectService');
const ACLMiddleware = require('../../middleware/acl');

/**
 * 프로젝트 API 라우터
 * @param {Object} fastify - Fastify 인스턴스
 */
async function projectRoutes(fastify, options) {
  
  // 모든 프로젝트 조회 API (테넌트별)
  fastify.get('/', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          tenant_id: { type: 'number', minimum: 1 },
          limit: { type: 'number', minimum: 1, maximum: 1000, default: 100 },
          offset: { type: 'number', minimum: 0, default: 0 },
          search: { type: 'string', maxLength: 100 }
        }
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              color: { type: 'string' },
              tenant_id: { type: 'string' },
              owner_id: { type: 'string' },
              description: { oneOf: [{ type: 'string' }, { type: 'null' }] },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { tenant_id, limit, offset, search } = request.query;
      
      // 개발용 테스트 데이터 반환
      const testProjects = [
        {
          id: "1",
          tenant_id: "1",
          owner_id: "1",
          name: "프로젝트 A",
          color: "#3b82f6",
          description: "팀 프로젝트 A",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: "2",
          tenant_id: "1",
          owner_id: "1",
          name: "프로젝트 B",
          color: "#ef4444",
          description: "개인 프로젝트 B",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: "3",
          tenant_id: "1",
          owner_id: "1",
          name: "프로젝트 C",
          color: "#10b981",
          description: "연구 프로젝트 C",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      // 필터링 로직 (간단한 구현)
      let filteredProjects = testProjects;
      
      if (search) {
        filteredProjects = testProjects.filter(project => 
          project.name.toLowerCase().includes(search.toLowerCase()) ||
          project.description.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      // 페이징 로직
      const startIndex = offset || 0;
      const endIndex = startIndex + (limit || 100);
      filteredProjects = filteredProjects.slice(startIndex, endIndex);
      
      reply.send(filteredProjects);
    } catch (error) {
      reply.code(500).send({
        error: 'Internal Server Error',
        message: error.message
      });
    }
  });
  
  // 프로젝트 생성 API
  fastify.post('/', {
    schema: {
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          color: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
          description: { oneOf: [{ type: 'string', maxLength: 1000 }, { type: 'null' }] },
          settings: { type: 'object' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            color: { type: 'string' },
            tenant_id: { type: 'number' },
            owner_id: { type: 'number' },
            description: { oneOf: [{ type: 'string' }, { type: 'null' }] },
            settings: { type: 'object' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        409: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    },
    preHandler: [
      ACLMiddleware.authenticateUser(),
      ACLMiddleware.requireTenantMembership()
    ]
  }, async (request, reply) => {
    try {
      const { tenant_id, owner_id, ...projectData } = request.body;
      
      // 실제 구현에서는 request에서 가져온 값 사용
      const project = await ProjectService.createProject({
        tenant_id: tenant_id || request.user.tenant_id,
        owner_id: owner_id || request.user.id,
        ...projectData
      });
      
      reply.code(201).send(project);
    } catch (error) {
      if (error.message.includes('already exists')) {
        reply.code(409).send({
          error: 'Conflict',
          message: error.message
        });
      } else {
        reply.code(400).send({
          error: 'Bad Request',
          message: error.message
        });
      }
    }
  });

  // 프로젝트 조회 API (ID로)
  fastify.get('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'number', minimum: 1 }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            color: { type: 'string' },
            tenant_id: { type: 'number' },
            owner_id: { type: 'number' },
            description: { oneOf: [{ type: 'string' }, { type: 'null' }] },
            settings: { type: 'object' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    },
    preHandler: [
      ACLMiddleware.authenticateUser(),
      ACLMiddleware.requireProjectMembership(),
      ACLMiddleware.requireViewerOrHigher()
    ]
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const project = await ProjectService.getProjectById(id);
      
      if (!project) {
        reply.code(404).send({
          error: 'Not Found',
          message: 'Project not found'
        });
        return;
      }
      
      reply.send(project);
    } catch (error) {
      reply.code(500).send({
        error: 'Internal Server Error',
        message: error.message
      });
    }
  });

  // 프로젝트 조회 API (멤버 포함)
  fastify.get('/:id/with-members', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'number', minimum: 1 }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            color: { type: 'string' },
            tenant_id: { type: 'number' },
            owner_id: { type: 'number' },
            description: { oneOf: [{ type: 'string' }, { type: 'null' }] },
            settings: { type: 'object' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            members: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  user_id: { type: 'number' },
                  role: { type: 'string' },
                  invited_at: { type: 'string', format: 'date-time' },
                  accepted_at: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const project = await ProjectService.getProjectWithMembers(id);
      
      if (!project) {
        reply.code(404).send({
          error: 'Not Found',
          message: 'Project not found'
        });
        return;
      }
      
      reply.send(project);
    } catch (error) {
      reply.code(500).send({
        error: 'Internal Server Error',
        message: error.message
      });
    }
  });

  // 프로젝트 수정 API
  fastify.patch('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'number', minimum: 1 }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          color: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
          description: { oneOf: [{ type: 'string', maxLength: 1000 }, { type: 'null' }] },
          settings: { type: 'object' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            color: { type: 'string' },
            tenant_id: { type: 'number' },
            owner_id: { type: 'number' },
            description: { oneOf: [{ type: 'string' }, { type: 'null' }] },
            settings: { type: 'object' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        409: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    },
    preHandler: [
      ACLMiddleware.authenticateUser(),
      ACLMiddleware.requireProjectMembership(),
      ACLMiddleware.requireEditorOrHigher()
    ]
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const updateData = request.body;
      
      const project = await ProjectService.updateProject(id, updateData);
      
      if (!project) {
        reply.code(404).send({
          error: 'Not Found',
          message: 'Project not found'
        });
        return;
      }
      
      reply.send(project);
    } catch (error) {
      if (error.message.includes('already exists')) {
        reply.code(409).send({
          error: 'Conflict',
          message: error.message
        });
      } else if (error.message.includes('not found')) {
        reply.code(404).send({
          error: 'Not Found',
          message: error.message
        });
      } else {
        reply.code(400).send({
          error: 'Bad Request',
          message: error.message
        });
      }
    }
  });

  // 프로젝트 삭제 API
  fastify.delete('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'number', minimum: 1 }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            color: { type: 'string' },
            tenant_id: { type: 'number' },
            owner_id: { type: 'number' },
            description: { oneOf: [{ type: 'string' }, { type: 'null' }] },
            settings: { type: 'object' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        409: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    },
    preHandler: [
      ACLMiddleware.authenticateUser(),
      ACLMiddleware.requireProjectMembership(),
      ACLMiddleware.requireProjectOwner()
    ]
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const project = await ProjectService.deleteProject(id);
      
      if (!project) {
        reply.code(404).send({
          error: 'Not Found',
          message: 'Project not found'
        });
        return;
      }
      
      reply.send(project);
    } catch (error) {
      if (error.message.includes('not found')) {
        reply.code(404).send({
          error: 'Not Found',
          message: error.message
        });
      } else if (error.message.includes('active members')) {
        reply.code(409).send({
          error: 'Conflict',
          message: error.message
        });
      } else {
        reply.code(400).send({
          error: 'Bad Request',
          message: error.message
        });
      }
    }
  });

  // 테넌트별 프로젝트 목록 조회 API
  fastify.get('/tenant/:tenant_id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          tenant_id: { type: 'number', minimum: 1 }
        },
        required: ['tenant_id']
      },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number', minimum: 1, maximum: 1000, default: 10 },
          offset: { type: 'number', minimum: 0, default: 0 },
          search: { type: 'string', maxLength: 100 }
        }
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              color: { type: 'string' },
              tenant_id: { type: 'number' },
              owner_id: { type: 'number' },
              description: { oneOf: [{ type: 'string' }, { type: 'null' }] },
              created_at: { type: 'string', format: 'date-time' }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { tenant_id } = request.params;
      const { limit, offset, search } = request.query;
      
      let projects;
      if (search) {
        projects = await ProjectService.searchProjects(tenant_id, search, limit, offset);
      } else {
        projects = await ProjectService.getProjectsByTenant(tenant_id, limit, offset);
      }
      
      reply.send(projects);
    } catch (error) {
      reply.code(500).send({
        error: 'Internal Server Error',
        message: error.message
      });
    }
  });

  // 사용자별 프로젝트 목록 조회 API
  fastify.get('/user/:user_id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          user_id: { type: 'number', minimum: 1 }
        },
        required: ['user_id']
      },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number', minimum: 1, maximum: 1000, default: 10 },
          offset: { type: 'number', minimum: 0, default: 0 }
        }
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              color: { type: 'string' },
              tenant_id: { type: 'number' },
              owner_id: { type: 'number' },
              description: { oneOf: [{ type: 'string' }, { type: 'null' }] },
              created_at: { type: 'string', format: 'date-time' }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { user_id } = request.params;
      const { limit, offset } = request.query;
      
      const projects = await ProjectService.getProjectsByUser(user_id, limit, offset);
      reply.send(projects);
    } catch (error) {
      reply.code(500).send({
        error: 'Internal Server Error',
        message: error.message
      });
    }
  });

  // 프로젝트 통계 조회 API
  fastify.get('/stats/tenant/:tenant_id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          tenant_id: { type: 'number', minimum: 1 }
        },
        required: ['tenant_id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            total_projects: { type: 'number' },
            tenant_id: { type: 'number' },
            generated_at: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { tenant_id } = request.params;
      const stats = await ProjectService.getProjectStats(tenant_id);
      reply.send(stats);
    } catch (error) {
      reply.code(500).send({
        error: 'Internal Server Error',
        message: error.message
      });
    }
  });
}

module.exports = projectRoutes;
