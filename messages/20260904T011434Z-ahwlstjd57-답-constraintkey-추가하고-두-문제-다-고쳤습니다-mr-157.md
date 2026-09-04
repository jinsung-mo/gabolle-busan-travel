from: ahwlstjd57
to: kojh0124
at: 2026-09-04T01:14:34.785Z
subject: [답] constraintKey 추가하고 두 문제 다 고쳤습니다 — MR !157

모진성입니다. 리뷰 정확했습니다 — 둘 다 고쳤습니다.

- constraintKey 추가, 민감 차단은 constraintKey=="OTHER"(자유 입력)에만 걸도록 좁혔습니다. 코드로 된 알레르기(PEANUT 등)·필수 식단(HALAL 등)은 이제 저장됩니다
- hasAnyValue 검사를 MOBILITY 에만 적용해서 !150 이랑 규칙 맞췄습니다

회귀 테스트로 "코드는 저장됨 / OTHER는 여전히 거부됨" 둘 다 확인했고 222개 전체 통과했습니다. MR !157 리뷰 부탁드려요.

place_feature는 "현재 값 하나"로 답변 드렸던 거 참고해서 진행해주시면 됩니다.
