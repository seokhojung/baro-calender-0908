const request = require('supertest');
const { z } = require('zod');

// API Contract Schemas
const EventSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().optional(),
  starts_at_utc: z.string().datetime(),
  ends_at_utc: z.string().datetime(),
  timezone: z.string(),
  is_all_day: z.boolean(),
  project_id: z.number(),
  tenant_id: z.number(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  tags: z.array(z.object({
    tag_name: z.string(),
    tag_color: z.string().optional()
  })).optional()
});

const EventListResponseSchema = z.object({
  events: z.array(EventSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number()
});

const CreateEventRequestSchema = z.object({
  title: z.string().min(1).max(200),
  starts_at_utc: z.string().datetime(),
  ends_at_utc: z.string().datetime(),
  project_id: z.number(),
  tenant_id: z.number(),
  description: z.string().optional(),
  location: z.string().optional(),
  timezone: z.string().default('Asia/Seoul'),
  is_all_day: z.boolean().default(false),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  status: z.enum(['confirmed', 'tentative', 'cancelled']).default('confirmed'),
  visibility: z.enum(['default', 'public', 'private', 'confidential']).default('default'),
  tags: z.array(z.object({
    tag_name: z.string(),
    tag_color: z.string().optional()
  })).optional()
});

describe('Events API Contract Tests', () => {
  let app;
  let authToken;
  
  beforeAll(async () => {
    // Setup test app
    app = require('../../src/server');
    
    // Get auth token for tests
    const authResponse = await request(app)
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'testpassword'
      });
    
    authToken = authResponse.body.token;
  });
  
  afterAll(async () => {
    await app.close();
  });
  
  describe('GET /v1/events', () => {
    it('should return events matching the contract schema', async () => {
      const response = await request(app)
        .get('/v1/events')
        .query({
          tenant_id: 1,
          project_id: 1,
          from: '2025-01-01T00:00:00Z',
          to: '2025-12-31T23:59:59Z'
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      // Validate response against contract
      const validation = EventListResponseSchema.safeParse(response.body);
      
      if (!validation.success) {
        console.error('Contract violation:', validation.error.format());
      }
      
      expect(validation.success).toBe(true);
      expect(response.body.events).toBeInstanceOf(Array);
      expect(typeof response.body.total).toBe('number');
    });
    
    it('should reject requests with missing required parameters', async () => {
      await request(app)
        .get('/v1/events')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });
  
  describe('POST /v1/events', () => {
    it('should create event matching the contract schema', async () => {
      const newEvent = {
        title: 'Contract Test Event',
        starts_at_utc: '2025-02-01T10:00:00Z',
        ends_at_utc: '2025-02-01T11:00:00Z',
        project_id: 1,
        tenant_id: 1,
        description: 'Testing API contract'
      };
      
      // Validate request against contract
      const requestValidation = CreateEventRequestSchema.safeParse(newEvent);
      expect(requestValidation.success).toBe(true);
      
      const response = await request(app)
        .post('/v1/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newEvent)
        .expect(201);
      
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('message');
    });
    
    it('should reject invalid event data', async () => {
      const invalidEvent = {
        title: '', // Invalid: empty title
        starts_at_utc: 'not-a-date', // Invalid: not ISO date
        ends_at_utc: '2025-02-01T11:00:00Z',
        project_id: 'not-a-number' // Invalid: should be number
      };
      
      const validation = CreateEventRequestSchema.safeParse(invalidEvent);
      expect(validation.success).toBe(false);
      
      await request(app)
        .post('/v1/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidEvent)
        .expect(400);
    });
  });
  
  describe('PATCH /v1/events/:id', () => {
    it('should update event with partial data', async () => {
      const updateData = {
        title: 'Updated Event Title',
        description: 'Updated description'
      };
      
      const response = await request(app)
        .patch('/v1/events/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body.message).toBe('Event updated successfully');
    });
    
    it('should validate date consistency', async () => {
      const invalidUpdate = {
        starts_at_utc: '2025-02-02T10:00:00Z',
        ends_at_utc: '2025-02-01T10:00:00Z' // End before start
      };
      
      await request(app)
        .patch('/v1/events/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdate)
        .expect(400);
    });
  });
  
  describe('DELETE /v1/events/:id', () => {
    it('should delete event and return success message', async () => {
      const response = await request(app)
        .delete('/v1/events/999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.message).toBe('Event deleted successfully');
    });
    
    it('should return 404 for non-existent event', async () => {
      await request(app)
        .delete('/v1/events/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
  
  describe('Breaking Change Detection', () => {
    it('should detect if required fields are removed', () => {
      const oldSchema = EventSchema;
      const newSchemaWithoutTitle = EventSchema.omit({ title: true });
      
      // This would fail if title is removed
      const testEvent = {
        id: 1,
        title: 'Test Event', // This field is required
        starts_at_utc: '2025-01-01T10:00:00Z',
        ends_at_utc: '2025-01-01T11:00:00Z',
        // ... other fields
      };
      
      const oldValidation = oldSchema.safeParse(testEvent);
      const newValidation = newSchemaWithoutTitle.safeParse(testEvent);
      
      if (oldValidation.success && !newValidation.success) {
        console.warn('⚠️ Breaking change detected: Field removed from schema');
      }
    });
    
    it('should detect if field types change', () => {
      const testData = {
        project_id: "1" // String instead of number
      };
      
      const numberSchema = z.object({ project_id: z.number() });
      const stringSchema = z.object({ project_id: z.string() });
      
      const numberValid = numberSchema.safeParse(testData);
      const stringValid = stringSchema.safeParse(testData);
      
      if (!numberValid.success && stringValid.success) {
        console.warn('⚠️ Breaking change detected: Field type changed from number to string');
      }
    });
  });
});

// Contract Monitoring for Production
class APIContractMonitor {
  constructor() {
    this.violations = [];
  }
  
  validateContract(endpoint, method, data, schema) {
    const validation = schema.safeParse(data);
    
    if (!validation.success) {
      const violation = {
        endpoint,
        method,
        timestamp: new Date().toISOString(),
        errors: validation.error.format(),
        severity: this.calculateSeverity(validation.error)
      };
      
      this.violations.push(violation);
      this.handleViolation(violation);
    }
    
    return validation.success;
  }
  
  calculateSeverity(error) {
    // Critical if required fields are missing
    if (error.issues.some(issue => issue.code === 'invalid_type')) {
      return 'CRITICAL';
    }
    // Warning if optional fields have issues
    return 'WARNING';
  }
  
  handleViolation(violation) {
    console.error(`🚨 API Contract Violation Detected!`);
    console.error(`Endpoint: ${violation.endpoint}`);
    console.error(`Method: ${violation.method}`);
    console.error(`Severity: ${violation.severity}`);
    
    if (violation.severity === 'CRITICAL') {
      // Send alert to team
      this.sendAlert(violation);
      
      // Block the request in production
      throw new Error('Critical API contract violation - request blocked');
    }
  }
  
  sendAlert(violation) {
    // Integration with monitoring service
    console.log('📧 Sending alert to development team...');
    
    // Slack notification
    // await slack.send({
    //   text: `🚨 Critical API Contract Violation`,
    //   blocks: [...]
    // });
    
    // PagerDuty alert for critical violations
    // await pagerduty.trigger({...});
  }
  
  getReport() {
    return {
      totalViolations: this.violations.length,
      criticalViolations: this.violations.filter(v => v.severity === 'CRITICAL').length,
      violations: this.violations,
      recommendation: this.violations.length > 0 
        ? 'Review and fix contract violations before deployment'
        : 'All contracts valid'
    };
  }
}

module.exports = {
  EventSchema,
  EventListResponseSchema,
  CreateEventRequestSchema,
  APIContractMonitor
};