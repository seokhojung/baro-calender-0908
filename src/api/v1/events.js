const ACLMiddleware = require('../../middleware/acl');
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'baro_calendar',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Events API Routes
async function eventRoutes(fastify, options) {
  
  // GET /v1/events - 이벤트 목록 조회
  fastify.get('/', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          tenant_id: { type: 'number', minimum: 1 },
          project_id: { type: 'number', minimum: 1 },
          from: { type: 'string', format: 'date-time' },
          to: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['confirmed', 'tentative', 'cancelled'] },
          tags: { type: 'array', items: { type: 'string' } },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
          offset: { type: 'number', minimum: 0, default: 0 }
        },
        required: ['tenant_id', 'project_id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            events: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  location: { type: 'string' },
                  starts_at_utc: { type: 'string', format: 'date-time' },
                  ends_at_utc: { type: 'string', format: 'date-time' },
                  timezone: { type: 'string' },
                  is_all_day: { type: 'boolean' },
                  color: { type: 'string' },
                  status: { type: 'string' },
                  visibility: { type: 'string' },
                  rrule_json: { type: 'string' },
                  project_id: { type: 'number' },
                  created_by: { type: 'number' },
                  created_at: { type: 'string', format: 'date-time' },
                  updated_at: { type: 'string', format: 'date-time' },
                  tags: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        tag_name: { type: 'string' },
                        tag_color: { type: 'string' }
                      }
                    }
                  }
                }
              }
            },
            total: { type: 'number' },
            limit: { type: 'number' },
            offset: { type: 'number' }
          }
        }
      }
    },
    preHandler: [
      ACLMiddleware.authenticateUser(),
      ACLMiddleware.requireTenantMembership()
    ]
  }, async (request, reply) => {
    const { tenant_id, project_id, from, to, status, tags, limit, offset } = request.query;
    
    try {
      let query = `
        SELECT 
          e.*,
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'tag_name', et.tag_name,
                'tag_color', et.tag_color
              )
            ) FILTER (WHERE et.id IS NOT NULL), 
            '[]'
          ) as tags
        FROM events e
        LEFT JOIN event_tags et ON e.id = et.event_id
        WHERE e.tenant_id = $1 AND e.project_id = $2
      `;
      
      const params = [tenant_id, project_id];
      let paramIndex = 3;
      
      // Date range filter
      if (from) {
        query += ` AND e.ends_at_utc >= $${paramIndex}`;
        params.push(from);
        paramIndex++;
      }
      
      if (to) {
        query += ` AND e.starts_at_utc <= $${paramIndex}`;
        params.push(to);
        paramIndex++;
      }
      
      // Status filter
      if (status) {
        query += ` AND e.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }
      
      query += ` GROUP BY e.id ORDER BY e.starts_at_utc`;
      
      // Tag filter (post-processing)
      if (tags && tags.length > 0) {
        // This would be better done with a HAVING clause but keeping it simple for now
      }
      
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);
      
      const result = await pool.query(query, params);
      
      // Get total count
      const countQuery = `
        SELECT COUNT(DISTINCT e.id) as total
        FROM events e
        WHERE e.tenant_id = $1 AND e.project_id = $2
        ${from ? `AND e.ends_at_utc >= $3` : ''}
        ${to ? `AND e.starts_at_utc <= $${from ? 4 : 3}` : ''}
        ${status ? `AND e.status = $${paramIndex - 2}` : ''}
      `;
      
      const countParams = [tenant_id, project_id];
      if (from) countParams.push(from);
      if (to) countParams.push(to);
      if (status) countParams.push(status);
      
      const countResult = await pool.query(countQuery, countParams);
      
      reply.send({
        events: result.rows,
        total: parseInt(countResult.rows[0].total),
        limit,
        offset
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to fetch events' });
    }
  });

  // POST /v1/events - 이벤트 생성
  fastify.post('/', {
    schema: {
      body: {
        type: 'object',
        required: ['title', 'starts_at_utc', 'ends_at_utc', 'project_id', 'tenant_id'],
        properties: {
          tenant_id: { type: 'number', minimum: 1 },
          project_id: { type: 'number', minimum: 1 },
          title: { type: 'string', minLength: 1, maxLength: 200 },
          description: { type: 'string', maxLength: 2000 },
          location: { type: 'string', maxLength: 255 },
          starts_at_utc: { type: 'string', format: 'date-time' },
          ends_at_utc: { type: 'string', format: 'date-time' },
          timezone: { type: 'string', default: 'Asia/Seoul' },
          is_all_day: { type: 'boolean', default: false },
          color: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
          status: { type: 'string', enum: ['confirmed', 'tentative', 'cancelled'], default: 'confirmed' },
          visibility: { type: 'string', enum: ['default', 'public', 'private', 'confidential'], default: 'default' },
          rrule_json: { type: 'string' },
          exdates_json: { type: 'string' },
          tags: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                tag_name: { type: 'string', maxLength: 50 },
                tag_color: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' }
              }
            }
          }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'number' },
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
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const {
        tenant_id,
        project_id,
        title,
        description,
        location,
        starts_at_utc,
        ends_at_utc,
        timezone,
        is_all_day,
        color,
        status,
        visibility,
        rrule_json,
        exdates_json,
        tags
      } = request.body;
      
      const userId = request.user.id;
      
      // Insert event
      const eventQuery = `
        INSERT INTO events (
          tenant_id, project_id, title, description, location,
          starts_at_utc, ends_at_utc, timezone, is_all_day, color,
          status, visibility, rrule_json, exdates_json,
          created_by, updated_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $15
        ) RETURNING id
      `;
      
      const eventValues = [
        tenant_id, project_id, title, description, location,
        starts_at_utc, ends_at_utc, timezone, is_all_day, color,
        status, visibility, rrule_json, exdates_json, userId
      ];
      
      const eventResult = await client.query(eventQuery, eventValues);
      const eventId = eventResult.rows[0].id;
      
      // Insert tags if provided
      if (tags && tags.length > 0) {
        for (const tag of tags) {
          await client.query(
            `INSERT INTO event_tags (event_id, tag_name, tag_color) 
             VALUES ($1, $2, $3)`,
            [eventId, tag.tag_name, tag.tag_color]
          );
        }
      }
      
      // If recurring event, generate occurrences for the next 3 months
      if (rrule_json) {
        // TODO: Implement RRULE parsing and occurrence generation
        // This would use a library like rrule.js to parse and generate occurrences
      }
      
      await client.query('COMMIT');
      
      reply.code(201).send({
        id: eventId,
        message: 'Event created successfully'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      fastify.log.error(error);
      
      if (error.message.includes('events_end_after_start')) {
        reply.code(400).send({ error: 'End time must be after start time' });
      } else {
        reply.code(500).send({ error: 'Failed to create event' });
      }
    } finally {
      client.release();
    }
  });

  // GET /v1/events/:id - 이벤트 상세 조회
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
            title: { type: 'string' },
            description: { type: 'string' },
            location: { type: 'string' },
            starts_at_utc: { type: 'string', format: 'date-time' },
            ends_at_utc: { type: 'string', format: 'date-time' },
            timezone: { type: 'string' },
            is_all_day: { type: 'boolean' },
            color: { type: 'string' },
            status: { type: 'string' },
            visibility: { type: 'string' },
            rrule_json: { type: 'string' },
            exdates_json: { type: 'string' },
            project_id: { type: 'number' },
            tenant_id: { type: 'number' },
            created_by: { type: 'number' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            tags: { type: 'array' },
            attachments: { type: 'array' },
            reminders: { type: 'array' }
          }
        }
      }
    },
    preHandler: [
      ACLMiddleware.authenticateUser(),
      ACLMiddleware.requireTenantMembership()
    ]
  }, async (request, reply) => {
    const { id } = request.params;
    
    try {
      // Get event with tags
      const eventQuery = `
        SELECT 
          e.*,
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'id', et.id,
                'tag_name', et.tag_name,
                'tag_color', et.tag_color
              )
            ) FILTER (WHERE et.id IS NOT NULL), 
            '[]'
          ) as tags,
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'id', ea.id,
                'file_name', ea.file_name,
                'file_size', ea.file_size,
                'mime_type', ea.mime_type,
                'uploaded_at', ea.uploaded_at
              )
            ) FILTER (WHERE ea.id IS NOT NULL), 
            '[]'
          ) as attachments,
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'id', er.id,
                'minutes_before', er.minutes_before,
                'method', er.method
              )
            ) FILTER (WHERE er.id IS NOT NULL AND er.user_id = $2), 
            '[]'
          ) as reminders
        FROM events e
        LEFT JOIN event_tags et ON e.id = et.event_id
        LEFT JOIN event_attachments ea ON e.id = ea.event_id
        LEFT JOIN event_reminders er ON e.id = er.event_id
        WHERE e.id = $1
        GROUP BY e.id
      `;
      
      const result = await pool.query(eventQuery, [id, request.user.id]);
      
      if (result.rows.length === 0) {
        reply.code(404).send({ error: 'Event not found' });
        return;
      }
      
      reply.send(result.rows[0]);
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to fetch event' });
    }
  });

  // PATCH /v1/events/:id - 이벤트 수정
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
          title: { type: 'string', minLength: 1, maxLength: 200 },
          description: { type: 'string', maxLength: 2000 },
          location: { type: 'string', maxLength: 255 },
          starts_at_utc: { type: 'string', format: 'date-time' },
          ends_at_utc: { type: 'string', format: 'date-time' },
          timezone: { type: 'string' },
          is_all_day: { type: 'boolean' },
          color: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
          status: { type: 'string', enum: ['confirmed', 'tentative', 'cancelled'] },
          visibility: { type: 'string', enum: ['default', 'public', 'private', 'confidential'] },
          rrule_json: { type: 'string' },
          exdates_json: { type: 'string' },
          tags: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                tag_name: { type: 'string', maxLength: 50 },
                tag_color: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' }
              }
            }
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
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
    const { id } = request.params;
    const updates = request.body;
    const userId = request.user.id;
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Build dynamic update query
      const updateFields = [];
      const updateValues = [];
      let valueIndex = 1;
      
      for (const [key, value] of Object.entries(updates)) {
        if (key !== 'tags') {
          updateFields.push(`${key} = $${valueIndex}`);
          updateValues.push(value);
          valueIndex++;
        }
      }
      
      if (updateFields.length > 0) {
        updateFields.push(`updated_by = $${valueIndex}`);
        updateValues.push(userId);
        valueIndex++;
        
        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        
        const updateQuery = `
          UPDATE events 
          SET ${updateFields.join(', ')}
          WHERE id = $${valueIndex}
          RETURNING id
        `;
        updateValues.push(id);
        
        const result = await client.query(updateQuery, updateValues);
        
        if (result.rows.length === 0) {
          await client.query('ROLLBACK');
          reply.code(404).send({ error: 'Event not found' });
          return;
        }
      }
      
      // Update tags if provided
      if (updates.tags) {
        // Remove existing tags
        await client.query('DELETE FROM event_tags WHERE event_id = $1', [id]);
        
        // Insert new tags
        for (const tag of updates.tags) {
          await client.query(
            `INSERT INTO event_tags (event_id, tag_name, tag_color) 
             VALUES ($1, $2, $3)`,
            [id, tag.tag_name, tag.tag_color]
          );
        }
      }
      
      // If recurring event rules changed, regenerate occurrences
      if (updates.rrule_json !== undefined) {
        // TODO: Delete old occurrences and generate new ones
      }
      
      await client.query('COMMIT');
      
      reply.send({ message: 'Event updated successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      fastify.log.error(error);
      
      if (error.message.includes('events_end_after_start')) {
        reply.code(400).send({ error: 'End time must be after start time' });
      } else {
        reply.code(500).send({ error: 'Failed to update event' });
      }
    } finally {
      client.release();
    }
  });

  // DELETE /v1/events/:id - 이벤트 삭제
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
    const { id } = request.params;
    
    try {
      const result = await pool.query(
        'DELETE FROM events WHERE id = $1 RETURNING id',
        [id]
      );
      
      if (result.rows.length === 0) {
        reply.code(404).send({ error: 'Event not found' });
        return;
      }
      
      reply.send({ message: 'Event deleted successfully' });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to delete event' });
    }
  });

  // POST /v1/events/:id/reminders - 알림 설정
  fastify.post('/:id/reminders', {
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
        required: ['minutes_before', 'method'],
        properties: {
          minutes_before: { type: 'number', minimum: 0, maximum: 40320 }, // Max 4 weeks
          method: { type: 'string', enum: ['email', 'popup', 'push'] }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            message: { type: 'string' }
          }
        }
      }
    },
    preHandler: [
      ACLMiddleware.authenticateUser()
    ]
  }, async (request, reply) => {
    const { id } = request.params;
    const { minutes_before, method } = request.body;
    const userId = request.user.id;
    
    try {
      const result = await pool.query(
        `INSERT INTO event_reminders (event_id, user_id, minutes_before, method) 
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (event_id, user_id, minutes_before, method) DO NOTHING
         RETURNING id`,
        [id, userId, minutes_before, method]
      );
      
      if (result.rows.length === 0) {
        reply.code(409).send({ error: 'Reminder already exists' });
        return;
      }
      
      reply.code(201).send({
        id: result.rows[0].id,
        message: 'Reminder created successfully'
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to create reminder' });
    }
  });

  // GET /v1/events/occurrences - 반복 일정 발생 조회
  fastify.get('/occurrences', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          tenant_id: { type: 'number', minimum: 1 },
          project_id: { type: 'number', minimum: 1 },
          from: { type: 'string', format: 'date-time' },
          to: { type: 'string', format: 'date-time' },
          event_id: { type: 'number', minimum: 1 }
        },
        required: ['tenant_id', 'from', 'to']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            occurrences: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  event_id: { type: 'number' },
                  occurrence_start_utc: { type: 'string', format: 'date-time' },
                  occurrence_end_utc: { type: 'string', format: 'date-time' },
                  is_exception: { type: 'boolean' },
                  exception_data: { type: 'object' }
                }
              }
            }
          }
        }
      }
    },
    preHandler: [
      ACLMiddleware.authenticateUser(),
      ACLMiddleware.requireTenantMembership()
    ]
  }, async (request, reply) => {
    const { tenant_id, project_id, from, to, event_id } = request.query;
    
    try {
      let query = `
        SELECT * FROM event_occurrences
        WHERE tenant_id = $1 
        AND occurrence_start_utc >= $2
        AND occurrence_end_utc <= $3
      `;
      
      const params = [tenant_id, from, to];
      
      if (project_id) {
        query += ` AND project_id = $4`;
        params.push(project_id);
      }
      
      if (event_id) {
        query += ` AND event_id = $${params.length + 1}`;
        params.push(event_id);
      }
      
      query += ` ORDER BY occurrence_start_utc`;
      
      const result = await pool.query(query, params);
      
      reply.send({ occurrences: result.rows });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to fetch occurrences' });
    }
  });
}

module.exports = eventRoutes;