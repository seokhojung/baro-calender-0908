import { CalendarAPIClient, CalendarDataTransformer } from '../calendar-client';
import { CreateEventRequest, UpdateEventRequest, APIEvent, CalendarEventTransformed } from '@/types/api';

// Mock fetch globally
global.fetch = jest.fn();

describe('CalendarAPIClient', () => {
  let client: CalendarAPIClient;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    client = new CalendarAPIClient('http://localhost:8000');
    mockFetch.mockClear();
  });

  describe('authentication', () => {
    it('should set auth token', () => {
      client.setAuthToken('test-token');
      // Test that token is being sent with requests by making a call
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ events: [], total: 0, limit: 20, offset: 0 }),
        headers: new Headers({ 'content-type': 'application/json' })
      };
      mockFetch.mockResolvedValueOnce(mockResponse as any);

      client.getEvents({ tenant_id: 1, project_id: 1 });
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/events'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          })
        })
      );
    });

    it('should clear auth token', () => {
      client.setAuthToken('test-token');
      client.clearAuthToken();
      
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ events: [], total: 0, limit: 20, offset: 0 }),
        headers: new Headers({ 'content-type': 'application/json' })
      };
      mockFetch.mockResolvedValueOnce(mockResponse as any);

      client.getEvents({ tenant_id: 1, project_id: 1 });
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/events'),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.anything()
          })
        })
      );
    });
  });

  describe('getEvents', () => {
    it('should fetch events successfully', async () => {
      const mockEvents = [
        {
          id: 1,
          title: 'Test Event',
          starts_at_utc: '2024-01-15T09:00:00.000Z',
          ends_at_utc: '2024-01-15T10:00:00.000Z',
          is_all_day: false,
          color: '#FF0000',
          project_id: 1,
          tenant_id: 1
        }
      ];

      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ events: mockEvents, total: 1, limit: 20, offset: 0 }),
        headers: new Headers({ 'content-type': 'application/json' })
      };
      mockFetch.mockResolvedValueOnce(mockResponse as any);

      const result = await client.getEvents({
        tenant_id: 1,
        project_id: 1,
        from: '2024-01-15T00:00:00.000Z',
        to: '2024-01-15T23:59:59.999Z'
      });

      expect(result.events).toHaveLength(1);
      expect(result.events[0]!.title).toBe('Test Event');
      expect(result.total).toBe(1);
    });

    it('should handle query parameters correctly', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ events: [], total: 0, limit: 20, offset: 0 }),
        headers: new Headers({ 'content-type': 'application/json' })
      };
      mockFetch.mockResolvedValueOnce(mockResponse as any);

      await client.getEvents({
        tenant_id: 1,
        project_id: 2,
        from: '2024-01-01T00:00:00.000Z',
        to: '2024-01-31T23:59:59.999Z',
        status: 'confirmed',
        tags: ['meeting', 'important'],
        limit: 50,
        offset: 10
      });

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toContain('tenant_id=1');
      expect(calledUrl).toContain('project_id=2');
      expect(calledUrl).toContain('from=2024-01-01T00%3A00%3A00.000Z');
      expect(calledUrl).toContain('status=confirmed');
      expect(calledUrl).toContain('tags=meeting');
      expect(calledUrl).toContain('tags=important');
      expect(calledUrl).toContain('limit=50');
      expect(calledUrl).toContain('offset=10');
    });
  });

  describe('createEvent', () => {
    it('should create event successfully', async () => {
      const eventData: CreateEventRequest = {
        tenant_id: 1,
        project_id: 1,
        title: 'New Event',
        starts_at_utc: '2024-01-15T09:00:00.000Z',
        ends_at_utc: '2024-01-15T10:00:00.000Z',
        is_all_day: false,
        color: '#0000FF'
      };

      const mockResponse = {
        ok: true,
        status: 201,
        json: jest.fn().mockResolvedValue({ id: 123, message: 'Event created successfully' }),
        headers: new Headers({ 'content-type': 'application/json' })
      };
      mockFetch.mockResolvedValueOnce(mockResponse as any);

      const result = await client.createEvent(eventData);

      expect(result.id).toBe(123);
      expect(result.message).toBe('Event created successfully');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/v1/events',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(eventData)
        })
      );
    });
  });

  describe('updateEvent', () => {
    it('should update event successfully', async () => {
      const updateData: UpdateEventRequest = {
        title: 'Updated Event',
        color: '#00FF00'
      };

      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ message: 'Event updated successfully' }),
        headers: new Headers({ 'content-type': 'application/json' })
      };
      mockFetch.mockResolvedValueOnce(mockResponse as any);

      const result = await client.updateEvent(123, updateData);

      expect(result.message).toBe('Event updated successfully');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/v1/events/123',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(updateData)
        })
      );
    });
  });

  describe('deleteEvent', () => {
    it('should delete event successfully', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ message: 'Event deleted successfully' }),
        headers: new Headers({ 'content-type': 'application/json' })
      };
      mockFetch.mockResolvedValueOnce(mockResponse as any);

      const result = await client.deleteEvent(123);

      expect(result.message).toBe('Event deleted successfully');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/v1/events/123',
        expect.objectContaining({
          method: 'DELETE'
        })
      );
    });
  });

  describe('error handling', () => {
    it('should handle HTTP errors correctly', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: jest.fn().mockResolvedValue({ error: 'Event not found' }),
        headers: new Headers({ 'content-type': 'application/json' })
      };
      mockFetch.mockResolvedValueOnce(mockResponse as any);

      await expect(client.getEvent(999)).rejects.toThrow('HTTP 404: Not Found');
    });

    it('should handle network errors correctly', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(client.getEvent(123)).rejects.toThrow('Network error: Network error');
    });
  });

  describe('health check', () => {
    it('should return healthy status', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ status: 'healthy', timestamp: '2024-01-15T12:00:00.000Z' }),
        headers: new Headers({ 'content-type': 'application/json' })
      };
      mockFetch.mockResolvedValueOnce(mockResponse as any);

      const result = await client.healthCheck();

      expect(result.status).toBe('healthy');
      expect(result.timestamp).toBe('2024-01-15T12:00:00.000Z');
    });

    it('should handle health check errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await client.healthCheck();

      expect(result.status).toBe('error');
      expect(result.timestamp).toBeTruthy();
    });
  });
});

describe('CalendarDataTransformer', () => {
  describe('apiEventToClient', () => {
    it('should transform API event to client format correctly', () => {
      const apiEvent: APIEvent = {
        id: 1,
        title: 'Test Event',
        description: 'Test Description',
        starts_at_utc: '2024-01-15T09:00:00.000Z',
        ends_at_utc: '2024-01-15T10:00:00.000Z',
        timezone: 'Asia/Seoul',
        is_all_day: false,
        color: '#FF0000',
        status: 'confirmed',
        visibility: 'default',
        project_id: 1,
        tenant_id: 1,
        created_by: 1,
        updated_by: 1,
        created_at: '2024-01-14T00:00:00.000Z',
        updated_at: '2024-01-14T00:00:00.000Z'
      };

      const clientEvent = CalendarDataTransformer.apiEventToClient(apiEvent);

      expect(clientEvent.id).toBe('1');
      expect(clientEvent.title).toBe('Test Event');
      expect(clientEvent.startDate).toBeInstanceOf(Date);
      expect(clientEvent.endDate).toBeInstanceOf(Date);
      expect(clientEvent.allDay).toBe(false);
      expect(clientEvent.projectId).toBe(1);
      expect(clientEvent.tenantId).toBe(1);
    });

    it('should transform reminders correctly', () => {
      const apiEvent: APIEvent = {
        id: 1,
        title: 'Test Event',
        starts_at_utc: '2024-01-15T09:00:00.000Z',
        ends_at_utc: '2024-01-15T10:00:00.000Z',
        timezone: 'Asia/Seoul',
        is_all_day: false,
        color: '#FF0000',
        status: 'confirmed',
        visibility: 'default',
        project_id: 1,
        tenant_id: 1,
        created_by: 1,
        updated_by: 1,
        created_at: '2024-01-14T00:00:00.000Z',
        updated_at: '2024-01-14T00:00:00.000Z',
        reminders: [
          { id: 1, minutes_before: 15, method: 'popup' },
          { id: 2, minutes_before: 60, method: 'email' }
        ]
      };

      const clientEvent = CalendarDataTransformer.apiEventToClient(apiEvent);

      expect(clientEvent.reminders).toHaveLength(2);
      expect(clientEvent.reminders![0]).toEqual({ type: 'popup', minutes: 15 });
      expect(clientEvent.reminders![1]).toEqual({ type: 'email', minutes: 60 });
    });
  });

  describe('clientEventToAPI', () => {
    it('should transform client event to API format for creation', () => {
      const clientEvent: Partial<CalendarEventTransformed> = {
        title: 'Test Event',
        description: 'Test Description',
        startDate: new Date('2024-01-15T09:00:00.000Z'),
        endDate: new Date('2024-01-15T10:00:00.000Z'),
        allDay: false,
        color: '#FF0000',
        status: 'confirmed'
      };

      const apiEvent = CalendarDataTransformer.clientEventToAPI(clientEvent, 1, 2);

      expect(apiEvent.title).toBe('Test Event');
      expect(apiEvent.starts_at_utc).toBe('2024-01-15T09:00:00.000Z');
      expect(apiEvent.ends_at_utc).toBe('2024-01-15T10:00:00.000Z');
      expect(apiEvent.is_all_day).toBe(false);
      expect('tenant_id' in apiEvent).toBe(true);
      expect('project_id' in apiEvent).toBe(true);
    });

    it('should transform client event to API format for update', () => {
      const clientEvent: Partial<CalendarEventTransformed> = {
        title: 'Updated Event',
        color: '#00FF00'
      };

      const apiEvent = CalendarDataTransformer.clientEventToAPI(clientEvent, 1, 2);

      expect(apiEvent.title).toBe('Updated Event');
      expect(apiEvent.color).toBe('#00FF00');
      expect('tenant_id' in apiEvent).toBe(false); // Should not include for updates
      expect('project_id' in apiEvent).toBe(false);
    });
  });

  describe('transformEventsList', () => {
    it('should transform array of API events', () => {
      const apiEvents: APIEvent[] = [
        {
          id: 1,
          title: 'Event 1',
          starts_at_utc: '2024-01-15T09:00:00.000Z',
          ends_at_utc: '2024-01-15T10:00:00.000Z',
          timezone: 'Asia/Seoul',
          is_all_day: false,
          color: '#FF0000',
          status: 'confirmed',
          visibility: 'default',
          project_id: 1,
          tenant_id: 1,
          created_by: 1,
          updated_by: 1,
          created_at: '2024-01-14T00:00:00.000Z',
          updated_at: '2024-01-14T00:00:00.000Z'
        },
        {
          id: 2,
          title: 'Event 2',
          starts_at_utc: '2024-01-15T11:00:00.000Z',
          ends_at_utc: '2024-01-15T12:00:00.000Z',
          timezone: 'Asia/Seoul',
          is_all_day: false,
          color: '#00FF00',
          status: 'confirmed',
          visibility: 'default',
          project_id: 1,
          tenant_id: 1,
          created_by: 1,
          updated_by: 1,
          created_at: '2024-01-14T00:00:00.000Z',
          updated_at: '2024-01-14T00:00:00.000Z'
        }
      ];

      const clientEvents = CalendarDataTransformer.transformEventsList(apiEvents);

      expect(clientEvents).toHaveLength(2);
      expect(clientEvents[0].id).toBe('1');
      expect(clientEvents[0].title).toBe('Event 1');
      expect(clientEvents[1].id).toBe('2');
      expect(clientEvents[1].title).toBe('Event 2');
    });
  });

  describe('dateRangeToAPI', () => {
    it('should convert date range to ISO strings', () => {
      const start = new Date('2024-01-15T00:00:00.000Z');
      const end = new Date('2024-01-15T23:59:59.999Z');

      const range = CalendarDataTransformer.dateRangeToAPI(start, end);

      expect(range.from).toBe('2024-01-15T00:00:00.000Z');
      expect(range.to).toBe('2024-01-15T23:59:59.999Z');
    });
  });
});