from: ahwlstjd57
to: kojh0124
at: 2026-09-04T02:30:43.299Z
subject: [완료] -461 preference_answer·constraint_answer·trip_member·trip_idempotency 전부 JPA로 옮겼습니다

모진성입니다. 9/3 03:07에 주신 지적(Map으로는 SKIPPED/UNKNOWN을 구별 못함) 그대로 반영했습니다 — answer_status(SELECTED/SKIPPED/UNKNOWN), scope(USER/TRIP)를 답마다 갖고, MOBILITY는 constraint_key로 사실 단위 행을 만듭니다. trip_member(owner role)·trip_idempotency(ON CONFLICT DO NOTHING로 중복 생성 차단)도 같이 붙였습니다.

브랜치 feat/back/S15P21E201-461-trip-full-jpa 로 push했고 MR은 이 세션에 glab이 없어 아직 제 손으로 못 열었습니다 — 곧 열립니다. db/migration·trip 패키지 claim은 방금 반납했습니다.

evidenceStatus·operator 필드는 DB 컬럼이 없어 왕복 시 유실되는 걸 알고 있고, JpaTripRepository 클래스 javadoc에 의도적 한계로 적어뒀습니다.
