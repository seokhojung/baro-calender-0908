## 5. API

- **버전**: 모든 엔드포인트는 **`/v1`**. 차기 변경은 `/v2` 도입 및 `Sunset` 헤더 예고.
- **주요 엔드포인트**
  - `GET /v1/timeline?from&to&projects[]=…&assignees[]=…&tags=…` (기간 겹침: `end>from && start<to`) — `tags`는 정규화된 `event_tags(tag)`를 기준으로 필터링
  - `POST /v1/events` · `PATCH /v1/events/:id` · `DELETE /v1/events/:id`
  - `POST /v1/share-links` · `DELETE /v1/share-links/:id`
  - `GET /v1/projects/:id/members` · `POST /v1/projects/:id/members`
- **멱등성**: `POST`에 **Idempotency-Key** 헤더(24h) – 키+경로+사용자 기준으로 최초 응답 재사용.
- **캐시/ETag**: GET 60s(사소 변경), 조건부 요청(If-None-Match).
- **레이트리밋**: 읽기 120 rpm/유저, 쓰기 30 rpm/유저, 공유 링크 열람 60 rpm/토큰.
- **오류코드**: 400/401/403/404/409/410/422/429/500(표준 JSON 에러 바디: `code/message/details`).

> 제품 관점 요약은 PRD [11. API 계약 요약](../prd/11-api-contract-summary.md) 참고.
