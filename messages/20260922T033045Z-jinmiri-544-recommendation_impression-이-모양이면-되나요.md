from: jinmiri
fromEmail: wlsalfl321@naver.com
to: kojh0124
at: 2026-09-22T03:30:45.127Z
subject: 544 recommendation_impression — 이 모양이면 되나요? (requestId 는 결과 응답에 있음, 버전 셋은 앱에 없음)

544(추천 카드 실제 노출) 시작하려고 서버를 읽어 봤어요. 확인 둘만 부탁드려요.

**보낼 모양(제안)** — 카드가 화면에 «실제로» 들어왔을 때 한 번, 재렌더 중복 막음:
```
POST /api/v1/events
{ eventId, eventType: 'recommendation_impression', eventVersion: 1,
  tripId, requestId: <RecommendationResultResponse.requestId>, occurredAt,
  payload: { placeId, finalRank: <items 배열 순서 1부터>, reasonCodes, sourceScreen: 'recommendations' } }
```
- `requestId` 는 결과 응답(`RecommendationResultResponse.requestId`)에 이미 있어서 앱이 읽어 실으면 됩니다(지금은 앱 DTO 가 안 읽고 있음 — 제가 추가).

**질문**
1. `EventType.RECOMMENDATION_IMPRESSION` 이 `VersionRequirement.RECOMMENDATION`(ontology·dataset·policy, fallbackMode 따라)인데, 앱은 그 버전 값을 **모릅니다** — 결과 응답에 없어요. ingest 쪽에서 실제로 검사하는 코드는 못 찾았는데, (a) 앱이 안 보내도 되는지, (b) 서버가 requestId 로 RECOMMENDATION_REQUESTED 의 버전을 붙여 주는지, (c) 결과 응답에 버전을 실어 줘야 하는지 — 어느 쪽인가요?
2. payload 키 이름 — `placeId`·`finalRank`·`reasonCodes`·`sourceScreen` 이 읽는 쪽(ClientPayloadKeys) 이름과 맞나요? 다르면 맞는 이름 주세요.

(a)면 오늘 바로 올립니다. 화면은 RN 이라 IntersectionObserver 대신 FlatList `onViewableItemsChanged`(50% 이상 보이면)로 판정할게요.
