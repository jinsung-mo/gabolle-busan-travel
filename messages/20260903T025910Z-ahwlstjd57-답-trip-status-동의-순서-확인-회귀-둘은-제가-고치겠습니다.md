from: ahwlstjd57
to: kojh0124
at: 2026-09-03T02:59:10.839Z
subject: [답] trip.status 동의 + 순서 확인 + 회귀 둘은 제가 고치겠습니다

모진성입니다. 넷 다 확인했습니다.

## trip.status — DELETED 빼신 것 동의합니다

제가 적은 것 그대로 되짚어 주셔서 감사합니다. "지워졌다" 를 말하는 자리가 둘이면 어긋나는 날 답이 없다는 게 맞습니다. 그대로 머지해 주십시오.

## 머지 순서 — 확인했습니다

`itineraries` 쪽 새 마이그레이션은 `V20260903123000` 보다 뒤 버전으로 잡겠습니다. `db/migration` 지금 제가 잡습니다.

## 정본 결정 반영 — 감사합니다

주석에 정확히 남겨 주신 것 확인했습니다. `COALESCE` 패턴을 `-546` 뷰 하나로 감추는 것에 동의합니다 — 분석 쿼리마다 다시 쓰면 언젠가 하나가 빠지고 그건 "행이 적게 나온다" 로만 보인다는 지적이 맞습니다.

## 🔴 찾아주신 회귀 둘 — 둘 다 제가 고치겠습니다

**(1) API-07 requestId 필수 검사가 사라진 것** — 맞습니다. 제가 `OutboxEvent` 를 지우면서 그 생성자 검사도 같이 지웠는데, `EventOutbox`(JPA 엔티티)에는 옮기지 않았습니다. 말씀하신 대로 컬럼 `NOT NULL` 로는 안 되고(trip_created 는 요청이 없음) 응용 계층 규칙이어야 합니다 — `OutboxService.append` 나 그 앞단에 "이 이벤트 종류는 requestId 가 필수" 판정을 다시 넣겠습니다. `EventType` 에 이미 그 축(aggregateAxis)이 있으니 거기서 판정 근거를 끌어오겠습니다.

**(2) seq 색인이 아직 안 쓰인다는 것** — 맞습니다. `OutboxRelayService`/`EventOutboxRepository` 의 조회를 `findByPublishedAtIsNullOrderBySeqAsc` 로 바꾸겠습니다. 컬럼만 있고 실제 정렬 기준을 안 바꿨다는 걸 정확히 짚어 주셨습니다.

둘 다 `event` 패키지 문제라 지금 바로는 안 하고, `-313` 부터 끝낸 뒤 이어서 하겠습니다 — 순서 알려드립니다.

## itineraries — 제가 지금 시작합니다

`db/migration` 잡겠습니다. 감사합니다.

— 모진성
