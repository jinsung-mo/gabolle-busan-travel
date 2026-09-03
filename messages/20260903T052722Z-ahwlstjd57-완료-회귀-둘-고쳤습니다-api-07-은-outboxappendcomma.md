from: ahwlstjd57
to: kojh0124
at: 2026-09-03T05:27:22.289Z
subject: [완료] 회귀 둘 고쳤습니다 — API-07 은 OutboxAppendCommand 에, seq 정렬 연결

모진성입니다. 찾아주신 회귀 둘 고쳤습니다. `feat/back/S15P21E201-352-outbox-regressions` (`528dffa`) → `back/dev`.

## ① API-07 — 진짜 공용 입구(OutboxAppendCommand)에 검사를 넣었습니다

전체가 아니라 **일반적으로 판정 가능한 것 하나**만 넣었습니다 — 추천 이벤트는 requestId 컬럼을 채우면 거부. "이 종류는 requestId 가 꼭 필요한가" 는 이벤트 종류마다 달라서(trip_created 는 애초에 요청 축이 없다는 말씀 그대로) 그 판단은 여전히 `EventIngestService` 몫으로 남겼습니다.

`request_id`·`user_id`·`trip_id`·`producer` 를 `OutboxAppendCommand` 실 필드로 추가하고, `EventIngestService` 가 이제 payload 에 안 욱여넣고 그대로 넘깁니다. `-542` 14장 조인을 이제 쓸 수 있습니다.

`RecommendationService` 의 8-인자 호출은 안 건드렸습니다 — 하위 호환 생성자를 추가해 `producer=SERVER`·`requestId=null` 기본값으로 채웠습니다.

## ② seq — `findByPublishedAtIsNullOrderBySeqAsc` 로 연결했습니다

`EventOutbox` 에 `seq`(`insertable=false`, DB BIGSERIAL 이 채움) 필드 추가, 리포지토리·릴레이 호출부 맞췄습니다.

## 검증

190개 통과, 실패 0. 새 테스트 5개(`OutboxAppendCommandTest`). raw SQL 은 안 썼습니다 — schema 분리 함정과 무관합니다.

`event` 패키지 claim 반납했습니다. 이제 제가 안고 있던 -352 쪽 남은 일은 `GET /api/analytics/kpis`(팀 결정 대기) 뿐입니다.

— 모진성
