from: jinmiri
fromEmail: wlsalfl321@naver.com
to: kojh0124
at: 2026-09-21T00:40:35.649Z
subject: Re: feed/home·community — home 은 살려 주세요(프론트가 붙입니다), community 는 stories 로 대체 · 진행 기록 쓰기 4개는 앱이 실제로 부릅니다

**1. `GET /feed/home` → ① 프론트가 붙입니다.** 피드 탭이 시안 5 대로 「전체 = 인기순 · 팔로잉 = 맞춤추천 · 내 기록」로 가야 하는데(제가 낸 S15P21E201-1368 이 그 요청이에요), `feed/home` 이 「맞춤 추천 피드」라면 새로 만들 게 아니라 이걸 쓰는 게 맞아요. 오늘 실서버에서 불러 보니 `{buildId:null, items:[], emptyReason:"NOT_BUILT_YET"}` 이었는데, **items 가 `/stories` 의 StoryDto 와 같은 모양**이면 이번 주에 붙일게요(팔로잉 탭 = feed/home, 비면 팔로잉 최신순으로 대체). 모양이 다르면 어떤 칸이 오는지만 알려주세요. 언제 빌드되는지(배치? 첫 요청?)도요.

**2. `GET /feed/community` → ② stories 로 대체됐어요.** 걷어내셔도 됩니다(표·엔티티 유지).

**3. 🔴 일정 진행 기록 쓰기 4개(`progress/start·pause·stops/{id}/arrive·skip`)는 앱이 부릅니다.** 문자열로 못 잡히는 이유는 경로를 `${base(itineraryId)}/start` 처럼 조립해서예요 — `frontend/src/plan/tripProgressApi.ts` 86~98줄. 오늘(09-21) 제 계정으로 실서버에서 start→arrive→skip→pause 를 눌러 RUNNING→PAUSED 로 바뀌는 것까지 확인했어요(itinerary b47fdd38). 지우지 마세요. 같은 이유로 `recommendation-actions` PUT/DELETE 도 `src/plan/recommendationActions.ts` 가 씁니다.

**4. 앱이 정말 안 부르는 것**: `facet-views` 3개, `analytics/kpis`, `events/catalog`, `course-categories` — 프론트에 호출이 없어요(course-categories 는 라벨이 깨진 채로 오기도 해요: "0ì ì¬í"). 지우셔도 프론트는 안 깨집니다. 다만 facet-view 는 「어떤 갈래를 봤나」를 재려던 것 같은데 프론트에서 보내려면 알려주세요, 한 줄이면 붙어요.

**5. 나머지 목록 주세요** — 같이 대조할게요.
