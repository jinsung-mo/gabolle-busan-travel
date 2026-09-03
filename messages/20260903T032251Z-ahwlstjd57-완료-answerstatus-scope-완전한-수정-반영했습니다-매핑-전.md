from: ahwlstjd57
to: kojh0124
at: 2026-09-03T03:22:51.862Z
subject: [완료] answerStatus·scope 완전한 수정 반영했습니다 — 매핑 전에 됐습니다

모진성입니다. "지금이 제일 쌉니다" 그대로 받아 완전한 수정으로 갔습니다. `feat/back/S15P21E201-461-trip-query` 에 이어서 커밋했습니다 (`2f97bb1`).

## 반영한 것

- `PreferenceSnapshot.dimensions`(Map) → `answers: List<PreferenceAnswer>`. `PreferenceAnswer(dimension, valueJson, status)`, `status`는 `SELECTED·SKIPPED·UNKNOWN`. 생성자가 `(status==SELECTED) == (valueJson 있음)` 을 강제합니다 — `ck_preference_answer_value_matches_status` 그대로입니다
- `TripConstraint` 에 `answerStatus`(`SELECTED·NONE·UNKNOWN`)와 `scope` 추가. 값 유무 판정은 `value` 뿐 아니라 `threshold` 도 함께 봅니다 — MOBILITY 처럼 숫자만 있고 문자열 값은 없는 제약이 있어서입니다
- 새 공유 열거형 `PersonalizationScope{USER,TRIP}` — `PreferenceSnapshot`·`TripConstraint` 가 같이 씁니다
- 겸사겸사 `ck_constraint_answer_allergy_is_hard`(알레르기는 항상 HARD)도 도메인에 옮겼습니다. 기존 코드엔 없었습니다

## scope 는 요청에 안 넣었습니다

TRIP-01 이 만드는 스냅샷·제약은 `trip_id` 가 항상 있는 자리라 **서버가 TRIP 으로 고정**합니다 — `(scope='TRIP') = (trip_id IS NOT NULL)` 을 어길 방법이 없어서 클라이언트가 보낼 필요가 없다고 판단했습니다. USER 스코프는 별도 "내 취향 설정" 흐름이 생길 때 그쪽 몫으로 남겼습니다.

## 이번에 안 건드린 것 — 다음 매핑 때 필요합니다

1. `value`(문자열)와 `threshold`(숫자)가 여전히 별도 필드입니다. `constraint_answer.value` 가 JSONB 하나뿐이니 JPA 매핑 시점에 `{"value":...,"threshold":...}` 로 합쳐 넣어야 합니다
2. `constraint_key` 를 아직 안 뒀습니다 — 지금 `type` 이 그 자리를 겸하고 있어서, MOBILITY 안에서 어떤 사실인지(MAX_WALKING_METERS 등)는 매핑 때 나눠야 합니다

## 검증

150개 통과, 실패 0. 새 테스트 7개 — SKIPPED/UNKNOWN 이 값 없이 서로 구분되는지, SELECTED 인데 값 없으면 거부, 알레르기 SOFT 면 거부.

`trip` 은 여전히 메모리입니다 — 이번엔 DDL 이 요구하는 모양으로 도메인만 맞췄습니다.

— 모진성
