from: kojh0124
fromEmail: kojh0124@gmail.com
to: ahwlstjd57
at: 2026-09-07T06:03:52.949Z
subject: 🔴 [안전] PlaceCandidateQueryService.readValue 가 JSON 파싱 실패를 "알레르기 없음 확인" 으로 바꿉니다

고지혁입니다. S15P21E201-555(Editor's Pick 기준선) 작업 중 `place` 쪽에서 하나 발견했습니다. **제 자리가 아니라 손대지 않았고**, 제 코드에서는 다르게 처리했습니다.

## 무엇이 문제인가

`PlaceCandidateQueryService.readValue`(260~270행)가 이렇게 되어 있습니다.

```java
private JsonNode readValue(String raw) {
    if (raw == null || raw.isBlank()) return null;
    try { return this.objectMapper.readTree(raw); }
    catch (JacksonException exception) { return null; }   // ← 여기
}
```

파싱이 깨지면 값을 `null` 로 넣습니다. 그 값이 `PlaceFeatureView.value` 로 들어가고, 추천 채점기가 그것을 이렇게 읽습니다 (`BaselineCandidateScorer.bucketFor`).

```
row.evidenceStatus = "VERIFIED", raw = null
  → FeaturePresence.indicatesPresence("VERIFIED", null)      = false
  → FeaturePresence.cannotRuleOutPresence("VERIFIED", null)  = false
  → PresenceBucket.ABSENT   ("확인된 해당 없음")
```

즉 `ALLERGEN_TAG` 행의 JSON 이 깨져 있으면 **"땅콩이 없는 것이 확인됐다" 로 읽힙니다.** 그 판정이 `HARD_FILTER` 를 통과시킵니다.

🔴 방향이 정확히 반대입니다. 읽지 못했다는 것은 **모른다**는 뜻인데 **안전하다**로 바뀝니다. 그리고 아무 오류도 안 납니다 — 로그도 없고 예외도 없습니다.

## 지금 사고가 안 난 이유

`place_feature` 를 채우는 코드가 아직 없어서 깨진 JSON 이 들어올 일이 없습니다. 채우는 작업이 시작되면 그때는 늦습니다 — 어느 행이 파싱에 실패했는지는 그 순간에만 알 수 있습니다.

## 제 쪽에서 한 것

`EditorialPickBaselineProvider.toViews` 에서 같은 변환을 하면서, **값이 있는데 못 읽은 행은 목록에서 아예 뺐습니다.** 그러면 같은 조회가 행을 못 찾아 `UNVERIFIED` 가 되고, 미확인 사실로 남아 REQUIRED 등급에서 후보가 빠집니다. 모르는 것을 모른다고 하는 쪽입니다.

MR !297 의 `EditorialPickBaselineProvider` javadoc 에 근거를 적어 뒀습니다.

## 부탁

`readValue` 쪽도 같은 방향으로 갈지 봐 주시면 좋겠습니다. 선택지는 둘로 보입니다.

1. **행을 빼거나 `evidenceStatus` 를 `UNKNOWN` 으로 낮춘다** — 제가 한 것과 같은 방향
2. **파싱 실패를 로그로 남기고 그 장소를 후보에서 제외한다** — 더 강하게

어느 쪽이든 지금보다 낫습니다. `place` 패키지는 모진성 님 자리라 제가 고치지 않았습니다 — 필요하시면 제 쪽 구현을 그대로 가져다 쓰셔도 됩니다.

## 하나 더 — Pick 발행이 place 데이터에 막혀 있습니다

S15P21E201-555 의 작업 내용 첫 줄이 "부산 대표·로컬 Editor's Pick 을 최소 3개 발행 가능한 데이터로 준비한다" 인데, `editorial_pick_place.place_id` 가 `place` 를 참조하고 이 저장소에 `place` 행을 넣는 씨앗이 없어서 발행을 못 했습니다.

제가 해운대·광안리를 직접 INSERT 하지 않은 이유는, `place` 에 `place_id` 말고 유일 키가 없어서(`V20260904000000`) 나중에 수집이 같은 장소를 넣으면 **같은 곳이 두 행으로 남고 무엇이 정본인지 알 방법이 없기** 때문입니다.

**place 행이 언제쯤 들어오는지 알 수 있을까요?** 표는 준비됐으니 데이터가 들어오는 시점에 Pick 3개는 제가 발행하겠습니다.
