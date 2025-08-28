const fastify = require('fastify');

/**
 * 타임라인 API 라우터
 * @param {Object} fastify - Fastify 인스턴스
 */
async function timelineRoutes(fastify, options) {
  
  // 타임라인 조회 API
  fastify.get('/', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          from: { type: 'string', format: 'date-time' },
          to: { type: 'string', format: 'date-time' },
          projects: { 
            type: 'array', 
            items: { type: 'string' },
            default: []
          },
          assignees: { 
            type: 'array', 
            items: { type: 'string' },
            default: []
          },
          tags: { 
            type: 'array', 
            items: { type: 'string' },
            default: []
          }
        }
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              tenant_id: { type: 'string' },
              project_id: { type: 'string' },
              title: { type: 'string' },
              starts_at_utc: { type: 'string', format: 'date-time' },
              ends_at_utc: { type: 'string', format: 'date-time' },
              timezone: { type: 'string' },
              is_all_day: { type: 'boolean' },
              rrule_json: { oneOf: [{ type: 'string' }, { type: 'null' }] },
              exdates_json: { oneOf: [{ type: 'string' }, { type: 'null' }] },
              created_by: { type: 'string' },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
              project: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  color: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { from, to, projects, assignees, tags } = request.query;
      
      // 개발용 테스트 데이터 반환
      const testEvents = [
        {
          id: "1",
          tenant_id: "1",
          project_id: "1",
          title: "팀 미팅",
          starts_at_utc: new Date().toISOString(),
          ends_at_utc: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          timezone: "Asia/Seoul",
          is_all_day: false,
          rrule_json: null,
          exdates_json: null,
          created_by: "1",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          project: { 
            id: "1", 
            name: "프로젝트 A", 
            color: "#3b82f6" 
          }
        },
        {
          id: "2",
          tenant_id: "1",
          project_id: "2",
          title: "코드 리뷰",
          starts_at_utc: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          ends_at_utc: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
          timezone: "Asia/Seoul",
          is_all_day: false,
          rrule_json: null,
          exdates_json: null,
          created_by: "1",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          project: { 
            id: "2", 
            name: "프로젝트 B", 
            color: "#ef4444" 
          }
        },
        {
          id: "3",
          tenant_id: "1",
          project_id: "3",
          title: "기획 회의",
          starts_at_utc: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          ends_at_utc: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
          timezone: "Asia/Seoul",
          is_all_day: false,
          rrule_json: null,
          exdates_json: null,
          created_by: "1",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          project: { 
            id: "3", 
            name: "프로젝트 C", 
            color: "#10b981" 
          }
        }
      ];
      
      // 필터링 로직 (간단한 구현)
      let filteredEvents = testEvents;
      
      if (from && to) {
        const fromDate = new Date(from);
        const toDate = new Date(to);
        filteredEvents = testEvents.filter(event => {
          const eventStart = new Date(event.starts_at_utc);
          return eventStart >= fromDate && eventStart <= toDate;
        });
      }
      
      if (projects && projects.length > 0) {
        filteredEvents = filteredEvents.filter(event => 
          projects.includes(event.project_id)
        );
      }
      
      reply.send(filteredEvents);
    } catch (error) {
      reply.code(500).send({
        error: 'Internal Server Error',
        message: error.message
      });
    }
  });
}

module.exports = timelineRoutes;
