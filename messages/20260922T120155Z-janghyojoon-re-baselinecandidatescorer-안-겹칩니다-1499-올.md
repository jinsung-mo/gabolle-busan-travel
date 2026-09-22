from: janghyojoon
fromEmail: rleaderjoon@gmail.com
to: kojh0124
at: 2026-09-22T12:01:55.565Z
subject: Re: BaselineCandidateScorer — 안 겹칩니다. -1499 올렸습니다 (MR !1470, CI 도는 중)

**`evaluateDiet` 과 안 겹칩니다.** 그 두 줄(325·331)은 손도 안 댔습니다. 제 변경은 취향 벡터 항(`applyTasteVectorComponent`)과 `evidenceSummary`, 그리고 메서드 서명뿐입니다.

MR **!1470** → `back/dev` 올렸고 지금 CI 도는 중입니다. 초록 되면 선점 풀고 다시 알리겠습니다. 급하지 않다고 하셨으니 머지 뒤에 붙이시면 됩니다.

## 다만 그 파일에서 이건 바뀝니다 — 리베이스 때 놀라지 마시라고

`UserTasteWeight`(엔티티)를 그대로 받던 자리가 **`TasteWeightComponent`**(읽기용 record)로 바뀝니다.

```java
// 서명
List<TasteWeightComponent> tasteWeights, double tasteVectorMultiplier

// 접근이 record 방식으로
w.getDimension() → w.dimension()
w.getEvidence()  → w.evidence()
w.getCode()      → w.code()
w.getWeight()    → w.weight()
```

`evaluateDiet`·`evaluateAllergy`·`evaluateMobility` 와 점수 계산부는 그대로입니다.

## 왜 record 를 하나 끼웠나

키에 `evidence` 를 더했더니 **한 성분이 여러 행**으로 앉습니다 (설문 행 하나, 행동 행 하나). 저장 행을 그대로 채점기에 넘기면 같은 성분을 두 번 세게 돼서, 읽어 넘기는 자리(`BaselineRecommendationEngine.currentTasteWeights()`)에서 `(차원, 코드)` 마다 하나로 합쳐 넘깁니다.

결과는 안 바뀝니다 — 합치는 규칙이 원래 `clamp(설문 + 행동)` 이라 나눠 적고 다시 더하면 같은 값입니다. 채점기 시험의 **기대값을 한 글자도 안 바꾸고** 입력만 두 행으로 나눠서 통과하는 걸로 고정해 뒀습니다.

## 🔴 그 자리에서 하나 나왔습니다 — 고칠지는 따로 정합시다

`applyTasteVectorComponent` 주석이 *「설문을 두 번 세지 않으려고」* `SURVEY` 를 거른다고 적혀 있는데, `BLENDED` 행의 값은 `설문 + 행동` **합**이라 설문 몫이 그대로 점수에 들어갑니다. **지금도 일부 새고 있습니다.**

이번 MR 은 「동작 안 바뀜」이 약속이라 일부러 그대로 뒀습니다. 다만 이제 설문 행과 행동 행이 따로 앉으니 **고치려면 고칠 수 있는 상태**가 됐습니다. 고치면 추천 점수가 실제로 움직이므로 티켓을 따로 끊는 게 맞다고 봅니다 — 의견 주시면 좋겠습니다.

## 앱 MR !1466 이 닫힘이라는 것도 봤습니다

순서상 기다리시는 게 맞다는 판단에 동의합니다. 서버가 먼저 나가면 경고가 화면에서 사라지는 것 맞습니다.
