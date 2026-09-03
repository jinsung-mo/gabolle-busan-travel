from: ahwlstjd57
to: kojh0124
at: 2026-09-03T01:50:18.239Z
subject: [완료] Java 쪽 합쳤습니다 — 이제 ALTER TABLE 만 남았습니다 (컬럼 4개 + seq)

모진성입니다. 아까 말씀드린 대로 **-352 에서 Java 쪽 통합을 끝냈습니다.** `event` 패키지 claim 도 반납했습니다.

브랜치: `feat/back/S15P21E201-352-outbox-unify` → `back/dev` (푸시 완료, MR 은 곧 엽니다)

---

## 지운 것 · 남긴 것

제 갈래를 지우고 고지혁 님 JPA 갈래로 합쳤습니다.

| | |
|---|---|
| 지움 | `domain/OutboxEvent` · `domain/EventOutboxRepository` · `infra/InMemoryEventOutboxRepository` · `OutboxIdempotencyTest` |
| 남김 | `repository/EventOutboxRepository`(JPA) · `domain/EventOutbox` · `OutboxService` — **전부 고지혁 님 것 그대로** |
| 옮김 | `EventType` 17종 · `Producer` 판정(DR-13) · `VersionRequirement` |

**`OutboxService` 의 세 규칙은 손대지 않았습니다** — `MANDATORY`, 한 입구, `SensitivePayloadGuard`. 그게 제 것을 버린 이유였습니다.

딱 하나 **추가**한 것이 있습니다. `appendReportingDuplicate` — 수집 API 응답의 `duplicate` 플래그에 "새로 적혔는지" 가 필요해서입니다. 기존 `append` 는 여기에 위임하므로 **`RecommendationRecorder` 는 한 줄도 안 바뀝니다.**

## 함께 고친 것 넷

- **`no-db` 프로필에서 `/api/v1/events` 가 사라집니다.** `application.properties` 에 적힌 팀 규칙 그대로 `@Profile({"db","dev"})` 를 붙였습니다. 있는 척하면서 메모리에 적는 것이 바로 그 고장이었습니다
- **ID 넷을 `String` → `UUID` 로.** 말씀하신 대로 UUID 유지 쪽입니다
- **`occurredAt` 을 `OffsetDateTime` 으로.** 문자열로 받고 `Instant.parse` 하면 시간대 없는 값이 조용히 UTC 로 읽힙니다 — 부산 09:00 이 18:00 로 적히고 아무도 모릅니다
- **`EventType` 에 aggregate 축을 붙였습니다.** 추천 → `recommendation`/`request_id`, 여행 → `trip`/`trip_id`. 고지혁 님이 `recommendation_failed` 계약에 적어 주신 그대로입니다

🔴 축을 못 정한 둘(`editorial_pick_published` · `feed_candidate_precomputed`)은 **비워 두고 쓰려는 순간 예외가 나게** 했습니다. 여행에도 추천 요청에도 안 붙는데 `aggregate_id` 는 `UUID NOT NULL` 이라, 아무 값이나 넣으면 그 행이 누구 것인지 영영 알 수 없습니다. **그 둘의 축은 나중에 같이 정해야 합니다.**

---

## 🔴 이제 고지혁 님 차례입니다 — ALTER TABLE

제 쪽에서 할 수 있는 것은 여기까지입니다. **`request_id` 는 여전히 payload(JSONB) 안에 있고, -542 의 조인 검증 쿼리는 아직 못 씁니다.**

```sql
ALTER TABLE event_outbox
    ADD COLUMN request_id UUID,
    ADD COLUMN user_id    UUID,
    ADD COLUMN trip_id    UUID,
    ADD COLUMN producer   VARCHAR(16),
    ADD COLUMN seq        BIGSERIAL;

DROP INDEX ix_event_outbox_pending;
CREATE INDEX ix_event_outbox_pending ON event_outbox (seq) WHERE published_at IS NULL;
CREATE INDEX ix_event_outbox_request ON event_outbox (request_id);
```

컬럼이 생기면 제가 **같은 티켓에서** 다음 셋을 이어서 합니다.

1. `EventIngestService.ENVELOPE_KEYS_STILL_IN_PAYLOAD` 를 지우고 `OutboxAppendCommand` 에 칸으로 옮김
2. 대기 조회를 `...OrderBySeqAsc` 로 바꿈
3. **탈퇴 익명화 복구** — `UPDATE event_outbox SET user_id = NULL WHERE user_id = ?` (NFR-08). 지금은 `user_id` 가 컬럼이 아니라 그 한 줄을 못 씁니다. 메모리 구현에 있던 `anonymizeUser` 는 **어느 탈퇴 흐름에도 연결돼 있지 않았고** DB 로 옮길 수 없어 함께 지웠습니다

`producer` 를 `VARCHAR(16)` 으로 둔 것은 값이 `CLIENT`·`SERVER` 둘뿐이라서입니다. `CHECK` 제약을 거실 거면 그것도 좋습니다.

---

## 🔴 제가 확인하지 못한 것 — 이건 꼭 봐 주셔야 합니다

`./gradlew build` 는 **125개 통과 · 실패 0** 인데 **34개가 건너뜀**입니다. 그 34개가 **전부 DB 를 쓰는 통합 테스트**입니다 — `OutboxTransactionIntegrationTest` 3개와 고지혁 님 `Recommendation*IntegrationTest` 31개.

제 PC 에 **도커도 PostgreSQL 도 없습니다.** 그래서 **"이벤트가 이제 진짜로 DB 에 적힌다" 를 실행으로 확인하지 못했습니다.** 제가 가진 근거는 구조적인 것뿐입니다 — 메모리 구현 클래스 자체가 없어졌고 `EventIngestService` 생성자가 `OutboxService` 만 받으므로 다른 경로가 존재하지 않습니다.

**고지혁 님은 도커나 `GABOLLE_TEST_DB_URL` 이 있으신 것 같으니**(그쪽 통합 테스트를 통과시키셨으니) MR 보실 때 한 번만 돌려 주십시오. 제가 못 본 것이 있으면 그때 나옵니다.

---

## 이벤트 사전 — 오늘 12:00 고정

**17종으로 고정합니다.** `recommendation_failed` 는 `Producer.SERVER` · `VersionRequirement.BEST_EFFORT` 로 들어가 있습니다 — 버전을 요구하지 않는 자리입니다.

아직 안 한 것 하나: **`requested_at` 을 payload 스키마에 넣는 것.** `occurred_at` − `requested_at` = 얼마나 버티다 죽었는가. 잊지 않게 코드 주석에 박아 뒀습니다.

— 모진성 (S15P21E201-352)
