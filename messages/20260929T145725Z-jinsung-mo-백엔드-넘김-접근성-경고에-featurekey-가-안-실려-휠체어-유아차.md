from: jinsung-mo
fromEmail: ahwlstjd57@gmail.com
to: all
at: 2026-09-29T14:57:25.814Z
subject: [백엔드 넘김] 접근성 경고에 featureKey 가 안 실려 휠체어·유아차를 앱이 구분 못 합니다 (급하지 않음) · 제 앞선 지적 3건은 정정합니다

build 46 QA 에서 「휠체어 문구가 거의 항상 뜬다」를 따라가다 **백엔드에 남은 것 하나**를 찾았습니다.
앱에서는 못 고치는 자리라 넘깁니다. **급하지 않습니다** — 발표 뒤에 보셔도 됩니다.

## 서버는 누구 때문인지 아는데, 그 정보를 버리고 있습니다

`BaselineCandidateScorer.evaluateMobility` 는 **`featureKey` 를 실어서** 사실을 만듭니다.
제가 진단 테스트를 짜서 실제로 찍어 봤습니다.

```
STROLLER      → {fact=ACCESSIBILITY_UNVERIFIED, featureKey=STROLLER}
HEAVY_LUGGAGE → {fact=ACCESSIBILITY_UNVERIFIED, featureKey=HEAVY_LUGGAGE}
```

그런데 `RecommendationResultQueryService.mobilityWarnings` (228행)가 **코드 문자열만 꺼냅니다.**

```java
for (String code : candidate.getWarningCodes()) {
    if (MOBILITY_EXACT_CODES.contains(code) || code.startsWith("ACCESS")) {
        result.add(code);      // ← featureKey 가 여기서 사라진다
    }
}
```

앱에 도착할 땐 휠체어인지 유아차인지 **구분이 불가능합니다.**

## 앱은 지금 「짐작」으로 메우고 있습니다

이예승 님이 -1814 에서 넣으신 `selectedMobilityAids` 는 **앱이 무엇을 골랐는지**로 문장을
고릅니다. 하나만 골랐으면 그것의 말로, **둘 이상이면 「고르신 이동 조건」** 으로 뭉뚱그립니다.

즉 **휠체어와 유아차를 둘 다 고른 사람**에게는 여전히 정확히 말하지 못합니다. 서버가
`featureKey` 를 주면 그 자리가 정확해집니다.

## 제안

`ACCESSIBILITY_UNVERIFIED:STROLLER` 처럼 뒤에 붙이는 방법이 있습니다. 앞부분만 보는 기존
앱은 그대로 동작하고(`startsWith("ACCESS")`), 새 앱만 뒤를 읽습니다. 다른 방법도 좋습니다 —
**구분할 수 있기만 하면** 됩니다.

## 그리고 제가 틀렸던 것 — 이건 정정입니다

처음에 `front/dev` 의 백엔드 사본만 보고 **셋을 더 지적하려 했습니다.** 실제 `back/dev` 를
열어 보니 **이미 다 고쳐져 있었습니다.**

| 제 처음 판단 | 실제 |
|---|---|
| 경사 `AVOID` 가 버려짐 | `PreferenceJson.slopeWord()` 가 0.0 으로 푼다 |
| 그늘 방향 미정 | `PREFER`=1.0, 「SHADE_SCORE 가 클수록 그늘」 명시 |
| `SLOPE_OVER_LIMIT` 안 나감 | 이미 보내고 있다 |

특히 「상관없어요」를 0 이 아니라 **`null`** 로 두신 처리는 제가 그냥 고쳤으면 놓쳤을 함정입니다
(*"0 은 가장 낮게 답했다라서 「피하고 싶어요」와 같아진다"*). 그 주석 덕에 제가 잘못 고치는 것을 멈췄습니다.

**`front/dev` 의 `backend/` 사본이 꽤 뒤처져 있습니다.** 저처럼 그걸 보고 「안 고쳐졌네」라고
판단하는 사람이 또 나올 수 있습니다.
