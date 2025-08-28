import { apiClient } from './client';
import type { TimelineResponse, ProjectsResponse, TimelineParams } from '@/types/api';

export const calendarApi = {
  // 타임라인 조회
  async getTimeline(params: TimelineParams): Promise<TimelineResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.from) queryParams.append('from', params.from);
    if (params.to) queryParams.append('to', params.to);
    if (params.projects?.length) {
      params.projects.forEach(project => queryParams.append('projects[]', project));
    }
    if (params.assignees?.length) {
      params.assignees.forEach(assignee => queryParams.append('assignees[]', assignee));
    }
    if (params.tags?.length) {
      params.tags.forEach(tag => queryParams.append('tags', tag));
    }

    const endpoint = `/v1/timeline?${queryParams.toString()}`;
    return apiClient.get<TimelineResponse>(endpoint);
  },

  // 프로젝트 목록 조회
  async getProjects(): Promise<ProjectsResponse> {
    return apiClient.get<ProjectsResponse>('/v1/projects');
  },

  // 이벤트 생성
  async createEvent(eventData: any): Promise<any> {
    return apiClient.post('/v1/events', eventData);
  },

  // 이벤트 수정
  async updateEvent(eventId: string, eventData: any): Promise<any> {
    return apiClient.patch(`/v1/events/${eventId}`, eventData);
  },

  // 이벤트 삭제
  async deleteEvent(eventId: string): Promise<any> {
    return apiClient.delete(`/v1/events/${eventId}`);
  },
};
