from: kojh0124
to: ahwlstjd57
at: 2026-09-03T01:23:39.290Z
subject: [실측] POST /api/v1/events 가 메모리에 적힙니다 — 그리고 Outbox 표 둘이 안 맞습니다

고지혁입니다. -554 표를 쓰려고 이벤트 쪽을 실측했는데 두 개 나왔습니다. 둘 다 -352 자리라 먼저 보냅니다.

## 1. 수집 API 가 DB 에 안 적습니다

`EventIngestService` 가 의존하는 `domain.EventOutboxRepository` 의 구현체가
`InMemoryEventOutboxRepository` 하나뿐입니다. `@Repository` 에 프로필 조건도 없어서 무조건 그것이 뜹니다.
그 클래스 주석에 이미 적혀 있습니다.

> 지금 application.properties 가 DataSource·JPA·Flyway 를 꺼 두었고, resources/db/migration 은
> 다른 사람이 점유 중이라 DDL 을 못 만든다. … 🔴 서버를 끄면 사라진다. 시연·테스트 전용이다.

그 "다른 사람" 이 저였습니다. 지금은 `db/migration` 이 비었으니 표를 만드실 수 있습니다.
(`spring.profiles.default=no-db` 라서 기본 실행은 DataSource 자체가 없습니다)

## 2. Outbox 표가 둘이고 컬럼이 안 맞습니다

| | `event_outbox` 표 (-543, DB) | `OutboxEvent` 클래스 (-352, 메모리) |
|---|---|---|
| 키 | `event_id` **UUID** | `eventId` **자유 문자열** |
| 라우팅 | `aggregate_type`·`aggregate_id`·`partition_key` | `producer` |
| 조인 축 | **없음** (payload JSONB 안) | `userId`·`tripId`·`requestId` **실컬럼** |

제가 -543 에서 표를 만들 때 `requestId` 를 실컬럼으로 안 뺐습니다. 그쪽 클래스가 맞습니다.

## 왜 이번 주에 급한가

-542 14장이 **9월 4일 전 체크리스트**인데 둘이 여기서 걸립니다.

- "Outbox 또는 동등한 방식으로 업무 저장과 이벤트 저장의 유실 방지" — 메모리라 미충족
- "후보 → 노출을 `request_id + place_id` 로 조인하는 검증 쿼리" — `request_id` 컬럼이 없어 못 씀
  (JSONB 에서 뽑아 조인하면 타입이 없고 느립니다)

그리고 `event_id UUID` 가 **-544 에도 영향**을 줍니다. 노출 이벤트 멱등키를
`impression:<requestId>:<placeId>` 같은 파생 문자열로 만들 계획이었는데 UUID 칸에 안 들어갑니다.

## 묻는 것 셋

1. `event_outbox` 에 `request_id`·`user_id`·`trip_id`·`producer` 를 **실컬럼으로 추가**해도 되겠습니까?
   (제 -543 표가 부족했던 부분이라 제가 `ALTER TABLE` 로 붙여도 됩니다)
2. `event_id` 는 UUID 로 두고 -544 에서 **UUIDv5**(**이름을 넣으면 항상 같은 UUID 가 나오는 방식**)로
   파생할까요, 아니면 `VARCHAR` 로 넓힐까요? 저는 UUID 유지 + v5 쪽입니다 — 색인이 낫습니다
3. 이 정리를 **-352 에서 하시겠습니까, 제가 티켓을 새로 파서 할까요?** 원래 자리는 -352 입니다.
   제가 하면 `event` 패키지를 잡아야 하니 겹칩니다

저는 `db/migration` 과 -554 취향·제약 표만 잡고 있습니다. `event` 패키지는 안 건드립니다.

— 고지혁
