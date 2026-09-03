from: ahwlstjd57
to: kojh0124
at: 2026-09-03T01:35:01.496Z
subject: [답] 실측 셋 다 맞습니다 + 못 보신 것 하나 — event 패키지에 Outbox 가 두 갈래로 돕니다

모진성입니다. 01:23 쪽지 확인했고 `origin/back/dev` 에서 직접 다시 재봤습니다. **세 지적 모두 사실입니다.** 묻는 것 셋에 답하고, 그 전에 **쪽지에 안 들어 있던 더 큰 것 하나**를 먼저 올립니다.

---

## 0. 🔴 먼저 — 컬럼만 붙여서는 안 고쳐집니다. 인터페이스가 둘입니다

`back/dev` 의 `event` 패키지에 **이름이 같은 인터페이스가 둘** 있습니다.

| 경로 | 만든 사람 | 구현 |
|---|---|---|
| `event/domain/EventOutboxRepository` | 저 (-352) | `InMemoryEventOutboxRepository` **하나뿐** |
| `event/repository/EventOutboxRepository` | 고지혁 님 (-543) | `JpaRepository<EventOutbox, UUID>` — **DB 로 감** |

그래서 `EventIngestService`(제 것)는 메모리로 가고 `OutboxService`(고지혁 님 것)는 DB 로 갑니다.
**"수집 API 가 DB 에 안 적는다" 는 증상이고, 원인은 이 이중화입니다.**
프로필 조건이나 컬럼 추가로는 안 없어집니다 — **둘 중 하나를 지워야** 합니다.

도메인 클래스도 마찬가지로 둘입니다 — `domain/EventOutbox`(고지혁 님) 와 `domain/OutboxEvent`(저).

**제 것을 지우고 고지혁 님 쪽으로 합치겠습니다.** 이유는 셋입니다.

1. `OutboxService.append` 가 **`Propagation.MANDATORY`** 라 스스로 트랜잭션을 안 엽니다. Outbox 의 존재 이유가 그 한 줄에 걸려 있고, 제 쪽에는 그 장치가 없습니다
2. **`OutboxService` 한 입구**로만 적는 규칙과 `SensitivePayloadGuard`(개인정보 검사)가 고지혁 님 쪽에만 있습니다
3. 고지혁 님 쪽은 **DB 에 실제로 적히고** 제 쪽은 안 적힙니다. -542 체크리스트가 요구하는 건 후자가 아닙니다

제 쪽에서 **살려서 옮길 것**은 둘뿐입니다.
- `EventType` 17종 + `Producer` 판정 (DR-13 — CLIENT 가 SERVER 이벤트를 못 만들게)
- `VersionRequirement`(NONE · RECOMMENDATION · BEST_EFFORT) — `recommendation_failed` 가 버전 없이 나갈 수 있게 하는 자리

---

## 1. `request_id`·`user_id`·`trip_id`·`producer` 실컬럼 — 예, 붙여 주십시오

**고지혁 님이 `ALTER TABLE` 로 하시는 게 맞습니다.** 본인 표이고, 지금 `db/migration` 을 잡고 있는 것도 본인입니다.

> 🔴 쪽지에 *"지금은 `db/migration` 이 비었으니 표를 만드실 수 있습니다"* 라고 쓰셨는데, **지금 장부에는 고지혁 님이 `-554` 로 그걸 잡고 계십니다.** 제가 지금 DDL 을 만들면 거부됩니다. 그래서 DDL 은 그쪽, Java 는 제 쪽으로 가르는 게 자연스럽습니다.

### 🔴 그 김에 하나 더 부탁드립니다 — 발행 순서가 뒤집힙니다

```sql
CREATE INDEX ix_event_outbox_pending ON event_outbox (publish_status, occurred_at);
```

`occurred_at` 만으로 정렬하면 **같은 시각에 적힌 이벤트의 순서가 보장되지 않습니다.**
제가 메모리 구현에서 정확히 이 버그를 테스트로 잡았습니다 — 고정 Clock 을 쓰니 `[evt_2, evt_3, evt_1]` 순으로 나왔습니다. 실제 DB 에서도 같은 밀리초에 두 건이 들어가면 같은 일이 납니다.

```sql
ALTER TABLE event_outbox ADD COLUMN seq BIGSERIAL;   -- 적힌 순서 그 자체
CREATE INDEX ix_event_outbox_pending
    ON event_outbox (seq) WHERE published_at IS NULL;   -- 부분 색인
```

`ORDER BY seq` 로 읽으면 순서가 확정됩니다. 부분 색인(**조건에 맞는 행만 색인에 넣는 것**)으로 하면 발행이 끝난 행은 색인에서 빠져서, 표가 커져도 대기 조회가 안 느려집니다.

---

## 2. `event_id` — UUID 유지에 동의합니다. 다만 **v5 에 함정이 있습니다**

🔴 **Java 표준 `UUID.nameUUIDFromBytes()` 는 v5(SHA-1)가 아니라 v3(MD5) 입니다.**
v5 를 쓰려면 직접 구현하거나 의존성을 넣어야 합니다.

멱등키 파생에 필요한 성질(**같은 이름 → 항상 같은 UUID**)은 v3 도 똑같이 만족합니다. 그래서 저는 **v3 로 가되 주석에 "v3(MD5)" 라고 정확히 적는 쪽**을 권합니다. "v5" 라고 써 놓고 v3 를 쓰면 나중에 아무도 못 찾습니다. v5 가 꼭 필요하시면 그것도 괜찮습니다 — **어느 쪽이든 이름과 실제가 같기만 하면 됩니다.**

그리고 파생에 쓴 **원본 문자열(`impression:<requestId>:<placeId>`)은 payload 에 남겨 주십시오.** 안 남기면 장애가 났을 때 UUID 만 보고는 무엇의 이벤트인지 읽을 수 없습니다.

---

## 3. 정리는 -352 에서 제가 하겠습니다 — 이렇게 자르면 안 겹칩니다

| 무엇 | 누가 | 어디 |
|---|---|---|
| `ALTER TABLE` (컬럼 4개 + `seq` + 부분 색인) | **고지혁** | `backend/src/main/resources/db/migration` |
| Java 통합 (인터페이스 이중화 제거 · `eventId` UUID 화 · 컬럼 매핑 · `EventType`/`Producer` 이식) | **저** | `backend/src/main/java/com/gabolle/backend/event` |

새 티켓은 안 파는 게 낫다고 봅니다. **원래 자리가 -352 이고**, 티켓을 새로 파면 "왜 -352 가 닫혔는데 같은 걸 또 하나" 가 이력에 남습니다.

---

## 나머지 두 쪽지에 대한 답

**`recommendation_failed`** — **이미 반영돼 있습니다.** `EventType` 에 `RECOMMENDATION_FAILED(SERVER, 필수, BEST_EFFORT)` 로 들어가 있고, **버전을 요구하지 않는 자리**로 뒀습니다. 말씀하신 "버전을 알기도 전에 죽는 경우" 가 정확히 그 자리입니다. 이벤트 사전은 **합집합 16종 + `recommendation_failed` = 17종**으로 고정합니다.
아직 안 한 것: **`occurred_at`(실패 시각) 과 `requested_at`(요청 시각)을 나눠 두는 것.** payload 스키마에 반영하겠습니다.

**온톨로지 UNKNOWN severity** — 제 자리가 아니라 답을 못 드립니다. 다만 그 안에서 **DATA 께 요구하신 숫자(부산 200곳의 식단·접근성 태그 채움률·결측률)** 는 제 몫이 맞습니다. 그게 없으면 "미확인은 감춘다" 가 M1 을 깨뜨리는지 아무도 모른다는 지적에 동의합니다. 다만 지금은 -352 통합을 먼저 끝내고 그 다음에 재겠습니다 — **오늘 12:00 안에는 못 냅니다.** 그 전에 정책을 정하셔야 하면 **(b) 설계서대로 `unknown-exclusion-threshold=NONE`** 쪽이 안전합니다. 숫자 없이 (a) 를 고르면 후보가 말라붙어도 그게 데이터 탓인지 정책 탓인지 못 가립니다.

---

지금부터 `event` 패키지를 잡고 통합을 시작합니다. `db/migration` 은 안 건드립니다.
**제 통합 방향(0번 — 제 것을 지우고 그쪽으로 합침)에 이견 있으시면 지금 말씀해 주십시오.** 되돌리기가 뒤로 갈수록 비쌉니다.

— 모진성 (S15P21E201-352)
