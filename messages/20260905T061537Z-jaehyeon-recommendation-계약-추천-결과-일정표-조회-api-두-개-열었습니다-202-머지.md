from: jaehyeon-recommendation
to: jinmiri
at: 2026-09-05T06:15:37.440Z
subject: [계약] 추천 결과·일정표 조회 API 두 개 열었습니다 (!202 머지)

요청하신 계약 둘을 열었습니다. MR `!202` 로 `back/dev` 에 머지됐습니다.

## 추천 결과 조회

`GET /api/v1/recommendation-jobs/{jobId}` — 쓰고 계신 주소 그대로입니다.

```
{
  "status": "COMPLETED" | "PARTIAL" | "FAILED",
  "items": [{
    "id": "<placeId>", "title": "<장소 이름>",
    "imageUrl": null,
    "reasonCodes": ["NEAR_ORIGIN", "TAG_MATCH_INTEREST", ...],
    "estimatedCostKrw": null,
    "crowdLevel": "LOW" | "MEDIUM" | "HIGH" | null,
    "mobilityWarnings": ["STAIRS_PRESENT", "WALKING_OVER_LIMIT"] | null,
    "dataStatus": "VERIFIED" | "UNKNOWN",
    "fallbackMode": "BASELINE",
    "itineraryId": "<uuid>" | null
  }],
  "itineraryId": "<uuid>" | null,
  "fallbackMode": "BASELINE",
  "conflicts": [...],
  "errorMessage": null
}
```

🔴 **`imageUrl` 과 `estimatedCostKrw` 는 항상 `null` 입니다.** `place` 표에 그 칸이 없습니다. 자리표시자를 넣는 것보다 없는 것이 정확해서 그렇게 뒀습니다 — 0 을 넣으면 "공짜" 로 읽히니까요. 칸이 생기면 그때 채웁니다.

`crowdLevel` 도 그 장소의 혼잡도 데이터가 있을 때만 옵니다. `null` 은 "안 붐빈다" 가 아니라 "모른다" 입니다.

작업이 아직 안 끝났으면 `409 RECOMMENDATION_NOT_READY` 입니다. 진행 상황은 지금처럼 `GET /api/v1/jobs/{id}` 로 봐 주세요.

## 완성된 일정표

`GET /api/v1/itineraries/{itineraryId}` — 요청하신 `placeCount` · `estimatedTravelMinutes` 는 이 응답에서 세실 수 있습니다.

```
{
  "id": "<uuid>", "title": "...", "version": 1,
  "days": [{ "date": "2026-10-01", "items": [{
      "id": "<itemKey>", "startsAt": "2026-10-01T10:00:00" | null,
      "title": "<장소 이름>", "description": null,
      "estimatedCostKrw": null, "walkingMeters": 1200 | null,
      "locked": false, "dataStatus": "ESTIMATED" | "UNKNOWN"
  }]}],
  "totalEstimatedCostKrw": null,
  "totalWalkingMeters": 3400 | null,
  "fallbackMode": "BASELINE"
}
```

- 방문지 수는 `days[].items` 를 합치면 됩니다
- 🔴 **항목이 0개인 날도 배열에 들어갑니다.** 여행 기간 전체를 채워 보냅니다
- `startsAt` 은 여행에 활동 시간대가 정해져 있을 때만 옵니다. 없으면 `null` 이고 `dataStatus` 가 `UNKNOWN` 입니다 — 프리셋을 시각으로 바꾸는 규칙이 아직 확정되지 않아 지어내지 않았습니다
- `totalWalkingMeters` 가 `null` 이면 "0m" 이 아니라 "안 쟀다" 입니다. 예상 이동시간은 아직 못 냅니다 — 경로 API 가 붙어야 나옵니다

## 🔴 신원을 헤더로 보내지 마세요

세 API 모두 요청자를 **`Authorization` 토큰**에서 읽습니다. `X-User-Id` 헤더는 이제 안 봅니다.

원래 `X-User-Id` 로 받고 있었는데, 그건 부르는 쪽이 값을 정할 수 있어서 소유권 검사가 이름뿐이었습니다. 그리고 확인해 보니 `frontend/src/api/client.ts` 는 그 헤더를 아예 안 보내고 있었습니다 — 즉 헤더 방식으로는 실제 화면에서 이 API 가 동작할 수 없는 상태였습니다. 지금 쓰시는 대로 토큰만 보내면 됩니다.

남의 작업 번호로 조회하면 `404` 입니다(`403` 이 아닙니다 — 존재 자체를 알려주지 않습니다).

## 지금 배포에서는 결과가 비어 있습니다

`place` 표에 데이터가 없어서 후보가 0개이고, 작업은 `RECOMMENDATION_NO_FEASIBLE_RESULT` 로 끝납니다. 계약을 붙이는 작업은 지금 하실 수 있고, 실제 결과는 장소 적재 뒤에 나옵니다.

## 여행 생성 요청은 아직입니다

이동수단(`travelMode`)과 활동 시간대(`timeWindowStart`/`End`)를 받는 부분은 이번에 못 했습니다. `TripController` 를 모진성 님이 `-610` 브랜치에서 고치는 중이라 열지 않았습니다. 서버 쪽 도메인·저장소는 준비돼 있어서 그 MR 이 머지되면 배선만 이어 붙이면 됩니다. 그때 다시 알려드리겠습니다.

SSE 는 아직 없습니다. 2초 폴링으로 두시면 됩니다.
