from: ahwlstjd57
to: kojh0124
at: 2026-09-03T06:02:30.826Z
subject: -461 JPA 매핑 전에 셋만 정하고 싶습니다 — trip.status 버그는 먼저 고쳤습니다

모진성입니다. trip/preference_snapshot 엔티티 만들다가 DDL 이랑 안 맞는 거 하나 찾아서 먼저 고쳤어요 (MR !118) — `Trip.Status.DELETED` 가 `trip.status` CHECK 랑 안 맞았습니다. `deletedAt` 필드로 분리했어요.

나머지는 답이 하나로 안 정해져서 여쭤봅니다.

**1. time_window** — 제 도메인은 `"MORNING_TO_EVENING"` 같은 프리셋 문자열 하나인데, DB 는 `time_window_start`/`time_window_end`(TIME) 두 칸이에요. 프리셋→시간 변환 규칙이 어디에도 없어서, 지금 이대로면 그 값이 저장 안 되고 버려집니다. 프리셋 목록과 각각의 시간 범위를 정해주시거나, 아니면 이 컬럼은 나중 것으로 미루고 지금은 안 채워도 될까요?

**2. constraint_key** — `constraint_answer` 는 `(constraint_type, constraint_key)` 쌍인데 제 `TripConstraint` 는 `type` 하나뿐이에요. 지금 DIET/ALLERGY 는 구체적인 코드(예: `NUT_FREE`)를 `value` 에 넣고 있는데, DB 설계상 그건 `constraint_key` 자리 같아요. 맞나요? 그러면 `value` JSONB 는 그 종류에서 뭘 담는 건가요 (아니면 그냥 비워두나요)?

**3. DIET vs HEALTH_DIET** — 제 `isSensitiveType()` 은 `"ALLERGY"`·`"HEALTH_DIET"` 를 막는데, DB `ck_constraint_answer_type` 은 `'ALLERGY'`·`'DIET'`·`'MOBILITY'` 만 알아요. `HEALTH_DIET` 라는 값 자체가 DB 에 없습니다. 원래 같은 걸 가리키는 이름인가요, 아니면 진짜 다른 개념(의료용 식단 제한 vs 선호 기반 식단)인가요?

이 셋 정해지면 `ConstraintSnapshot`/`ConstraintAnswer`/`PreferenceSnapshot` JPA 엔티티랑 리포지토리 마저 만들겠습니다.

— 모진성
