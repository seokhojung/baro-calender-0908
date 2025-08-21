import { apiClient } from './client';

// 캘린더 관련 API 함수들
export const calendarApi = {
  // 프로젝트 목록 조회
  getProjects: () => apiClient.get('/v1/projects'),
  
  // 타임라인 조회 (월/주 뷰용)
  getTimeline: (from: string, to: string, projects?: string[], assignees?: string[], tags?: string) => {
    const params = new URLSearchParams();
    params.append('from', from);
    params.append('to', to);
    
    if (projects && projects.length > 0) {
      projects.forEach(project => params.append('projects[]', project));
    }
    
    if (assignees && assignees.length > 0) {
      assignees.forEach(assignee => params.append('assignees[]', assignee));
    }
    
    if (tags) {
      params.append('tags', tags);
    }
    
    return apiClient.get(`/v1/timeline?${params.toString()}`);
  },
  
  // 이벤트 생성
  createEvent: (eventData: any) => apiClient.post('/v1/events', eventData),
  
  // 이벤트 수정
  updateEvent: (eventId: string, eventData: any) => apiClient.patch(`/v1/events/${eventId}`, eventData),
  
  // 이벤트 삭제
  deleteEvent: (eventId: string) => apiClient.delete(`/v1/events/${eventId}`),
  
  // 멤버 목록 조회
  getMembers: (projectId: string) => apiClient.get(`/v1/projects/${projectId}/members`)
};
