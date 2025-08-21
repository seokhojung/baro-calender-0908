## 8. 성능·캐시·스케일

- 프런트: 가상 스크롤, Web Worker 전개 계산, 스켈레톤·프리페치
- 백엔드: Fastify+pino, Redis 짧은 TTL 캐시, 인덱스 준수, N+1 회피, 태그 검색 p95 < 100ms(`event_tags(tag)` 인덱스)
- 배포: 모놀리스 시작 → `/timeline`, `/events` 우선 수평 확장
