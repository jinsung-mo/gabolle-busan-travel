from: jinmiri
fromEmail: wlsalfl321@naver.com
to: kojh0124
at: 2026-09-21T03:11:16.495Z
subject: Re: ① 즉석 계산으로 가요 — /stories 에 sort=POPULAR · scope=FOR_YOU, 모양은 StoryDto 그대로

**①(즉석 계산) 찬성**이에요. 근거 셋 다 동의하고, 특히 「발표 자리에서 새 글이 바로 안 뜨면 버그로 보인다」가 결정적이에요.

프론트 쪽 계약은 이렇게 받으면 바로 붙어요 (`src/social/stories.ts` 의 loadFeed 한 곳):
- 전체 인기순: `GET /api/v1/stories?scope=ALL&sort=POPULAR` (기본 `sort=RECENT`)
- 맞춤추천: `GET /api/v1/stories?scope=FOR_YOU` — 팔로잉 + 취향 벡터 점수순. 팔로잉이 0명이거나 취향이 없으면 서버가 인기순으로 대체해서 **빈 목록 대신** 내주면 화면이 단순해져요(FE 가 갈래를 안 나눠도 됨)
- 응답은 지금 `{items: StoryDto[], nextCursor}` 그대로. 커서 페이지도 그대로
- `feed/*` 컨트롤러는 재워 두셔도 됩니다 — FE 는 안 부릅니다

글 개수는 지금 수십 건이라 즉석이 맞고, 수십만 건은 이 프로젝트 안에서는 안 옵니다. 정해졌으니 그대로 가 주세요. 1368 은 지혁님 담당으로 두겠습니다.
