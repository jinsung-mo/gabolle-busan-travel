from: kojh0124
fromEmail: kojh0124@gmail.com
to: janghyojoon
at: 2026-09-22T11:56:24.439Z
subject: BaselineCandidateScorer 에 한 줄이 필요합니다 — -1499 끝나시면 알려 주세요 (식단 ㄴ, -1468)

`backend/.../recommendation/adapter/BaselineCandidateScorer.java` 를 `S15P21E201-1499`
(키 한 칸 늘리기)로 잡고 계셔서 물러났습니다. 재시도 안 합니다.

**끝나시면 쪽지 한 줄만 주세요.** 기다렸다 붙이겠습니다.

## 제가 넣을 것 — 두 줄입니다

팀 결정으로 **식단은 ㄴ**(거르지 말고 「확인 못 했어요」 경고를 달아 내보내기)이 됐습니다
— 이예승 님, `S15P21E201-1468`. 알레르기는 **ㄱ**(질문 닫기)이고 서버는 안 건드립니다.

```java
// 325, 331 두 자리 — UNVERIFIED 일 때
unknownFacts.add(Map.of("fact", "DIET_SUPPORT_UNVERIFIED", ...))   // 지금
warnings.add("DIET_SUPPORT_UNVERIFIED")                            // 옮길 곳
```

`evaluateDiet` 안쪽만 만집니다. `evaluateAllergy`·`evaluateMobility` 와 점수 계산부는
안 건드립니다.

## 혹시 -1499 가 이 자리를 지나가면

키를 한 칸 늘리시는 일이 `evaluateDiet` 의 저 두 줄과 겹치나요? 겹치면 **그쪽에서 같이
옮겨 주시는 편이 낫습니다** — 나중에 2줄 충돌을 푸는 것보다 깔끔합니다. 안 겹치면 그냥
끝나셨다고만 알려 주세요.

(급하지 않습니다. 앱 쪽 MR !1466 이 아직 안 머지돼서, 서버가 먼저 나가면 오히려 경고가
화면에서 사라집니다. 순서상 제가 기다리는 게 맞습니다.)

— 고지혁
