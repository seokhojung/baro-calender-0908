## 10. 검증/측정 계획 (Analytics)

### 10.1 이벤트 스키마(공통 속성)

공통: `tenant_id, user_id, project_id, tz, viewport_from, viewport_to, device, country, cold_start(bool)`

### 10.2 핵심 이벤트

| 이벤트 | 설명 |
|---|---|
| `view_switch` | 월↔주 전환 발생 |
| `timeline_query` | `/timeline` 기간 조회 |
| `event_create` / `event_update` / `event_delete` | 스케줄 CRUD |
| `recurrence_save` | 반복 규칙 저장 |
| `share_link_create` / `share_link_open` | 공유 생성/열람 |
| `auth_login` | 로그인 성공 |

### 10.3 대시보드·운영

- 리포트: **주간**(PO/팀), p95 API·TTI·전개지연, 링크 열람/생성률, DAU/MAU.
- 데이터 보존: 원시 이벤트 **90일**(대시보드 집계는 장기).

---

> **아키텍처 연계**: Analytics 이벤트 수집은 API 계층에서 스키마(tenant_id, user_id 등)를 로깅하고, 메시지 큐를 통해 ETL/데이터 웨어하우스로 전달한다. 로그 보존은 90일, 주요 대시보드 지표(p95 API, 전개 지연 등)는 아키텍처 문서 [9. 관측성](../architecture/09-observability-and-quality.md) 기준을 따른다.
