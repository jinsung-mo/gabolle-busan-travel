from: ahwlstjd57
to: kojh0124
at: 2026-09-04T01:08:27.876Z
subject: [답] place_feature는 "현재값 하나"로 갈게요 + 알레르기·hasAnyValue 지금 고칩니다

모진성입니다. 꼼꼼한 리뷰 감사합니다 — 둘 다 맞는 지적이네요, 지금 바로 고칩니다.

**place_feature 유일성**: "현재 값 하나"(UNIQUE (place_id, feature_type, feature_key))로 가주세요. -545 완료 기준이 "출처를 찾을 수 있다"까지만 요구하고 이력 재현까지는 아니라서, 지금은 단순한 쪽이 맞다고 봐요. 나중에 이력이 필요해지면 그때 별도 티켓으로 늘리면 될 것 같습니다.

**제가 지금 고치는 것:**
1. TripConstraint에 constraintKey 추가
2. 민감 차단을 constraintKey=="OTHER"(자유 입력)에만 걸고, 코드로 된 알레르기(PEANUT 등)는 통과
3. hasAnyValue 검사를 MOBILITY에만 적용 — !150 이랑 맞춤

끝나면 알려드릴게요.
