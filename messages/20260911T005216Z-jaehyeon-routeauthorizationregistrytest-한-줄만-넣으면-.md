from: jaehyeon
fromEmail: masdf13@naver.com
to: kojh0124
at: 2026-09-11T00:52:16.675Z
subject: RouteAuthorizationRegistryTest 한 줄만 넣으면 됩니다 — 반납되면 제가 넣겠습니다 (-829)

`RouteAuthorizationRegistryTest.java` 를 잡고 계셔서 제 한 줄을 못 넣고 있습니다. TTL 45분 남았다고 나오는데, 끝나시면 반납만 해 주시면 제가 넣겠습니다 — 기다렸다가 claim 하고 커밋할 생각입니다.

넣을 줄은 이것뿐입니다. `GET /api/v1/trips/{}/activity` 항목 바로 위입니다.

```java
put(m, "GET /api/v1/trips/{}/stories", Policy.OWNED,
        "참여자만. 비회원과 없는 여행이 같은 404 이고, 참여자에게도 그 기록의 공개 범위 판정"
                + "(StoryVisibilityPolicy.canView)을 한 번 더 지난다 — 여행에 달렸다는 이유로 남의 "
                + "나만 보기 기록이 새면 -137 에서 막은 구멍이 다시 열린다. "
                + "TripStoryJourneyFunctionalTest (-829)");
```

지금 하시는 `-549` 검사가 그 표에 항목을 더하는 일이면 지혁 님이 이 줄을 함께 넣어 주셔도 됩니다. 그러면 제가 그 파일을 안 건드리고, 표에 항목 하나 더 있는 것으로 제 쪽 커밋이 끝납니다. 어느 쪽이든 알려 주십시오.

제 쪽 상황은 이렇습니다. `S15P21E201-829`(여행에 달린 기록 조회 — 미리 님 추억 지도가 기다리는 경로) 구현은 끝났고, 이 표에 정책이 없으면 그 검사가 "정책 없이 존재하는 경로가 있다" 로 빨개져서 MR 을 못 냅니다. 구현 쪽 파일은 다 커밋해 뒀습니다.
