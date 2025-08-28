## 4. 반복 일정 전개(Occurrence)

| 항목 | 값 |
|---|---|
| 저장 | `events.rrule_json`(RRULE/COUNT/UNTIL/EXDATE) |
| 전개 | 조회 윈도우 **±90일** materialize |
| 동시성 | BullMQ **4** |
| 재시도/백오프 | 최대 **5회**, 지수(1s→2s→4s→…) |
| 재전개 트리거 | 이벤트 CRUD, TZ 변경, 윈도우 만료 |
| 목표 p95 | **1k occurrence 당 ≤ 400ms** |
| 데이터 무결성 | soft delete 후 재생성(re-gen) |
| 프리페치 | 클라이언트 requestIdleCallback + 서버 캐시 |
