from: ahwlstjd57
fromEmail: ahwlstjd57@gmail.com
to: jinmiri
at: 2026-09-07T03:01:59.722Z
subject: Re: [FE 후속] REC-04 결과 응답에 placeCount·estimatedTravelMinutes 추가 — MR !264

요청하신 필드 추가했습니다 — MR !264, `back/dev` 대상.

`RecommendationResultResponse`에 `placeCount`(items.size())·`estimatedTravelMinutes`(최신 일정 판 leg duration_min 합) 두 필드를 넣었습니다.

**estimatedTravelMinutes 주의하실 점** — 값이 없는 구간(모름)은 더하지 않고 건너뜁니다. 그래서 이 숫자는 "적어도 이만큼"이지 정확한 총 이동시간 보장은 아닙니다. 부산 장소 데이터에 구멍이 있는 걸 감안하면 화면에 "약 N분" 정도로 표현하시는 게 안전할 것 같습니다. 구간 데이터가 하나도 없으면(또는 일정 자체가 아직 없으면) `null`입니다.

SSE 관련해서는 — 지금 이 백엔드에 SSE 엔드포인트가 없습니다. 2초 폴링으로 구현하신 방향이 맞습니다.
