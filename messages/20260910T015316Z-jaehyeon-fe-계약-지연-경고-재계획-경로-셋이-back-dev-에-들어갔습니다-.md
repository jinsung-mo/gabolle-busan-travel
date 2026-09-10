from: jaehyeon
fromEmail: masdf13@naver.com
to: jinmiri
at: 2026-09-10T01:53:16.463Z
subject: [FE 계약] 지연 경고·재계획 경로 셋이 back/dev 에 들어갔습니다 — paceFactor 가 null 일 수 있습니다

지연 경고 서버 쪽이 back/dev 에 들어갔습니다(MR !480, S15P21E201-96 · -304 · -308). 화면이 부를 계약을 남깁니다. 지금은 아무도 안 부르고 있습니다.

## 경로 셋

```
GET  /api/v1/itineraries/{itineraryId}/days/{dayIndex}/pace      그 하루의 예상 시각표
GET  /api/v1/itineraries/{itineraryId}/rhythm                    여행 리듬 요약
POST /api/v1/itineraries/{itineraryId}/days/{dayIndex}/replan    남은 하루 다시 짜기
```

앞의 둘은 보기만 하는 것이라 VIEWER 도 됩니다. 재계획은 편집 권한자만입니다.

## pace 응답

```json
{
  "itineraryId": "...",
  "dayIndex": 0,
  "paceFactor": 1.30,
  "sampleCount": 5,
  "minSamples": 3,
  "plannedDayEnd": "2026-09-10T18:00:00+09:00",
  "items": [
    { "itemId": "...", "visited": false,
      "predictedArrival": "2026-09-10T11:00:00+09:00",
      "predictedDeparture": "2026-09-10T12:30:00+09:00",
      "plannedArrival": "2026-09-10T10:30:00+09:00",
      "delayMinutes": 30, "atRisk": false }
  ],
  "atRiskItemIds": ["..."],
  "notChecked": [ { "check": "PACE_FACTOR", "reason": "NOT_ENOUGH_RECORDS" } ]
}
```

시각은 전부 Asia/Seoul 오프셋이 붙은 ISO 문자열입니다. itemId 는 일정 상세의 항목 id 와 같은 값입니다.

## 화면이 꼭 알아야 할 것 셋

1. paceFactor 가 null 일 수 있습니다. 아직 계수를 만들 만큼 방문 기록이 없다는 뜻입니다. 이때 1.0 으로 갈음해서 그리면 안 됩니다 — 1.0 은 "재 보니 계획대로 다니는 사람" 이라는 뜻이 되어 버려서, 실제로는 모르는 것을 "문제 없음" 으로 보여 주게 됩니다. sampleCount 와 minSamples 로 "3개 중 2개 모였습니다" 처럼 보여 주시면 됩니다. 이유는 notChecked 에 담겨 옵니다.

2. delayMinutes 는 음수일 수 있습니다. 계획보다 이르다는 뜻입니다.

3. visited 가 true 인 항목의 predictedArrival·predictedDeparture 는 예측이 아니라 실제로 기록된 시각입니다. plannedArrival 과 delayMinutes 는 그때 null 입니다.

## replan

baseVersion 은 다른 편집과 같습니다 — If-Match 헤더 또는 ?baseVersion=. 낡은 번호면 409 입니다.

거절이 하나 더 있습니다. 남은 일정이 그날 안에 안 들어가면 422 ITINERARY_REPLAN_OVERFLOWS_DAY 가 나가고 error.fields 에 넘치는 항목 id 가 들어 있습니다. 밀린 일정을 이어 붙이다 자정을 넘는 경우인데, 그 시각을 그대로 적으면 00:30 처럼 되감겨 "새벽에 갔다" 가 저장되기 때문에 아예 저장하지 않습니다. 이 상황은 pace 의 atRiskItemIds 로 미리 보이니, 재계획 버튼을 누르기 전에 "이 방문지들은 하루를 넘깁니다" 를 먼저 보여 주시는 편이 낫습니다.

## 방문 시각 기록은 이미 있습니다

계수는 PUT /api/v1/itineraries/{id}/items/{itemId}/actual 로 쌓인 도착·출발 기록에서 나옵니다(-293 에서 만든 것). 그 기록이 없으면 계수도 안 생기니, 지연 경고를 쓰려면 방문지에서 "도착/출발 찍기" 를 누를 자리가 화면에 있어야 합니다.

## 확인 안 된 것

장소 표가 0행이라 실제 일정으로 눌러 본 적이 없습니다. 검사가 세운 것은 직접 심은 픽스처입니다. 붙이시다가 응답 모양이 예상과 다르면 알려 주세요.
