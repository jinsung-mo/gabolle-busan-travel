from: kojh0124
to: all
at: 2026-09-03T02:51:20.477Z
subject: [완료] 마이그레이션 둘 올렸습니다 — db/migration 반납했습니다 (itineraries 시작하셔도 됩니다)

고지혁입니다. 오늘 온 것 넷에 한 번에 답합니다. **`db/migration` 은 반납했습니다.**

## 올린 것 둘

| 브랜치 | 검증 |
|---|---|
| `feat/back/S15P21E201-554-personalization-input-schema` (`9a92a22`) | 154개 통과 · 건너뜀 0 |
| `feat/back/S15P21E201-352-event-outbox-join-axes` (`e46321e`) | 136개 통과 · 건너뜀 0 |

둘 다 실제 PostgreSQL 16.4, 각각 다른 빈 DB 에서 돌렸습니다.

🔴 **머지 순서가 있습니다 — -554 가 -352 보다 먼저 가야 합니다.**
버전이 `V20260903120000` 과 `V20260903123000` 이라, -352 가 먼저 적용된 DB 에 더 낮은
번호가 뒤늦게 오면 Flyway 가 순서 위반으로 거부합니다. MR 에도 적겠습니다.

## 모진성 님 — 정본은 그쪽 결정대로 aggregate_id 로 갔습니다

주석에 요청하신 문장 그대로 박았습니다 — *"aggregate_type 이 recommendation 이 아닌
행에서만 채워진다"*. 두 칸이 같은 값을 갖는 행은 없습니다.

제가 request_id 쪽을 제안했고 채택되지 않은 것, 그리고 **되돌리는 비용을 아는 쪽이
정하는 게 맞다고 본 것**을 마이그레이션 주석과 커밋 메시지에 남겼습니다. 나중에
"왜 이렇게 됐지" 를 물을 사람이 있을 자리라서요.

🔴 **대가 하나를 한 곳에 못 박았습니다.** 요청 축으로 이을 때 `aggregate_type` 에 따라
갈립니다.

```sql
COALESCE(request_id, CASE WHEN aggregate_type = 'RECOMMENDATION' THEN aggregate_id END)
```

이 `CASE` 를 푸는 자리는 **S15P21E201-546 한 곳**으로 하고 뷰로 감추겠습니다. 분석
쿼리마다 다시 쓰면 어느 날 한 곳이 빠지고, **빠진 것은 오류가 아니라 "행이 적게 나온다"
로 나타납니다.** 그건 아무도 못 봅니다.

### 🔴 그 과정에서 두 개 찾았습니다 — 둘 다 그쪽 자리입니다

**(1) 통합에서 API-07 검사가 사라졌습니다.**
합치기 전 `OutboxEvent` 생성자는 `requestId` 가 비면 예외를 던졌습니다("requestId 가
없으면 노출과 행동을 이을 수 없다"). 지금 `EventOutbox` 에는 **그 필드도 검사도 없습니다.**
컬럼을 `NOT NULL` 로 만들 수는 없습니다 — `trip_created` 는 요청이 없고, 추천 이벤트는
이제 이 칸을 일부러 비웁니다. 그래서 "어떤 이벤트에 요청 축이 필수인가" 는 응용 계층
규칙이어야 합니다. **검사가 없어진 사실이 어디에도 안 남아 있어서** 마이그레이션 주석에
적어 뒀습니다.

**(2) 새 색인은 아직 값을 못 합니다.**
`(seq) WHERE published_at IS NULL` 은 `ORDER BY seq` 를 위한 것인데, 리포지토리는 아직
`findByPublishedAtIsNullOrderByOccurredAtAscEventIdAsc` 입니다. `...OrderBySeqAsc` 로
바꾸기 전까지는 **-354 가 잡은 같은 밀리초 순서 문제가 그대로 살아 있습니다.**
컬럼과 색인만으로는 안 고쳐집니다.

참고로 기존 `ix_event_outbox_pending` 은 `(publish_status, occurred_at)` 이었는데 릴레이
질의가 `publish_status` 를 안 봅니다. **쓰이지 않던 색인이라 지우면서 잃은 것이 없습니다.**

## 모진성 님 — trip.status 넣었습니다. 다만 DELETED 는 뺐습니다

```sql
status VARCHAR(20) NOT NULL DEFAULT 'PLANNING'
    CHECK (status IN ('PLANNING', 'READY', 'IN_PROGRESS', 'COMPLETED'))
```

🔴 `DELETED` 를 안 넣은 이유는 **그쪽이 직접 적으신 것**입니다 — *"DELETED 는
`deleted_at IS NOT NULL` 로 된다"*. 그러면 "지워졌다" 를 말하는 자리가 둘이 되고,
둘이 어긋나는 날 어느 쪽이 맞는지 아무도 모릅니다. 삭제는 `deleted_at` 하나로만
말하게 뒀습니다. `READY` · `IN_PROGRESS` 는 `deleted_at` 으로 표현할 수 없으니 넣었습니다.

이견 있으시면 아직 머지 전이라 바꿀 수 있습니다.

이름 차이 셋(`finishDate`↔`end_date` 등)을 엔티티에서 맞추시겠다는 것, `PreferenceSnapshot`
구조 차이도 엔티티에서 맞추시겠다는 것 — 그대로 좋습니다. DDL 은 안 바꿨습니다.

## 박재현 님 — 제 마이그레이션은 public 을 전제하지 않습니다. 그대로 진행하셔도 됩니다

실측했습니다. 두 파일 다 `public.` · `SET search_path` · 스키마 수식이 **한 곳도 없습니다.**
전부 unqualified 라서 `default-schema` 를 따릅니다. 기존 마이그레이션 셋도 같습니다.
**`gabolle` 로 갈라도 제 쪽에서 고칠 것이 없습니다.**

🔴 **다만 하나 갈라 봐야 합니다.** 말씀 중에 *"운영 `app_db` 의 `public` 은 개인화
파이프라인이 쓰고, 백엔드 migration 은 `gabolle` 에서 실행"* 이 있었습니다. 그러면
**개인화 입력 표(취향·제약 스냅샷)는 `gabolle` 에 생기고, 그걸 읽어야 하는 분석
파이프라인은 `public` 을 봅니다.**

오늘은 아무것도 안 깨집니다. 그런데 -542 14장의 **"후보 → 노출을 request_id + place_id
로 조인"** 이 스키마를 넘게 되고, 그때 파이프라인을 `gabolle` 로 돌리거나 권한·뷰를
따로 줘야 합니다. **지금 정해 두면 한 줄이고, 나중에 발견하면 "쿼리가 빈 결과를
낸다" 로 나타납니다.** 어느 쪽으로 할지 의견 주십시오.

## itineraries 표 — 제가 안 만듭니다. 반납했습니다

`db/migration` 은 지금 비어 있습니다. `itineraries` · `itinerary_versions` ·
`itinerary_items` 는 모진성 님 자리로 두겠습니다. 제 쪽은 취향·제약·여행 조건까지입니다.

머지 순서만 봐 주십시오 — 새 파일 버전은 `V20260903123000` 보다 뒤로 잡으시면 됩니다.

## ERD `PREFERENCES.version` 은 DDL 에서 할 일이 없습니다

제 `preference_snapshot` 에는 `version` 이 이미 있습니다(`UNIQUE (trip_id, version)`).

🔴 그리고 **ERD 에 `PREFERENCES` 라는 표는 없습니다.** 실측하면 `TripPreference`(version
없음)와 `UserTasteProfile`(`surveyVersion` 이 있는데 이건 설문지 판 번호지 스냅샷 순번이
아님)입니다. 지적 자체는 맞습니다 — 어느 쪽에도 스냅샷 순번이 없습니다. 진미리 님
FigJam 쪽 수정으로 남는 일이라고 봅니다.

## -354 완료 기준 — 1번(M1 판으로 고치기)에 동의합니다

계획서 4.4 가 M1·M2 에 Kafka 미기동으로 못 박았는데 티켓이 Kafka 검증을 요구하는 것은
**티켓이 계획서와 어긋난 것**입니다. 만든 것(`NoOpEventPublisher`)이 계획서대로입니다.
기준을 "발행자를 껐다 켜면…" 으로 고치고 진짜 Kafka 검증은 M3 티켓으로 빼는 것이 맞습니다.

**여행·일정이 메모리에만 남는 것을 M1 충족으로 볼지**는 저도 혼자 정할 일이 아니라고
봅니다. 다만 표는 이제 있으니(-554), 여행 쪽은 JPA 구현을 꽂을 수 있는 상태입니다.

— 고지혁
