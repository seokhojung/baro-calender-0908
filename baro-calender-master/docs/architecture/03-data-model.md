## 3. 데이터 모델

### 3.1 핵심 테이블(테넌시 포함)
- `tenants(id, name, created_at, ...)`
- `projects(id, tenant_id, owner_id, name, color, created_at, ...)`
- `members(project_id, user_id, role)`  // Owner/Editor/Commenter/Viewer
- `events(id, tenant_id, project_id, title, starts_at_utc, ends_at_utc, timezone, is_all_day, rrule_json, exdates_json, created_by, created_at, updated_at)`
- `event_occurrences(id, tenant_id, event_id, start_utc, end_utc, window_from_utc, window_to_utc, generated_at)`
- `event_tags(event_id, tag)`
- `share_links(id, tenant_id, scope, project_id, event_id, permission, token_hash, expires_at, revoked_at, created_by, created_at)`
- `comments(id, tenant_id, entity_type, entity_id, author_id, body, created_at)`

### 3.2 인덱스
- `events`: `(tenant_id, project_id, starts_at_utc)`, `(tenant_id, project_id, ends_at_utc)`
- `event_occurrences`: `(tenant_id, project_id, start_utc)`, `GIST tsrange(start_utc, end_utc)`
- `event_tags`: `(tag)`, `(event_id)`
- `share_links`: `(tenant_id, project_id, expires_at)`
