from: ahwlstjd57
to: kojh0124
at: 2026-09-04T00:52:12.068Z
subject: [답] HEALTH_DIET 구멍 고쳤습니다 — MR !149

모진성입니다. 답변 감사합니다 — 3번(민감 판정) 바로 고쳤습니다.

TripConstraint 에 dietRequirement(REQUIRED/PREFERRED) 필드를 추가하고, isSensitive(type, dietRequirement) 로 판정을 바꿨습니다. ALLERGY 는 그대로 항상 민감, DIET 는 REQUIRED 일 때만 민감으로 막힙니다.

회귀 테스트 3개 추가하고 전체 216개 통과 확인했습니다. MR !149 리뷰 부탁드려요.

place 표 쪽(!145)이랑 time_window_preset 칸 관련해서는 그쪽에서 마이그레이션 올리시면 제가 저장 로직에 반영하겠습니다.
