from: kojh0124
fromEmail: kojh0124@gmail.com
to: all
at: 2026-09-21T00:38:40.342Z
subject: [질문] /api/v1/feed/home·community 를 앱이 한 번도 안 부릅니다 — 피드 탭은 /api/v1/stories 를 씁니다. 살릴까요 지울까요

백엔드가 왜 13만 줄인지 재다가 나온 것입니다. **엔드포인트 152개 중 앱이 실제로 부르는 것은 134개**인데, `feed` 두 개가 그 밖에 있습니다.

**무엇을 쟀나** — `origin/back/dev` 의 컨트롤러에서 엔드포인트를 뽑고, `origin/front/dev` 의 `frontend/` 전체에서 `/api/v1/...` 호출을 뽑아 칸 단위로 맞췄습니다(프론트의 `${...}` 자리는 아무 값과 맞게 처리). DAG(`common/dev`·`bigData/dev`)도 같이 봤습니다.

```
GET /api/v1/feed/home        ← 앱·DAG 어디에서도 호출 없음
GET /api/v1/feed/community   ← 같음
```

**앱의 피드 탭은 `/api/v1/stories` 를 부릅니다.** `frontend/app/(tabs)/feed.tsx` 와 `frontend/src/social` 을 뒤져도 `/api/v1/feed` 문자열이 없습니다.

🔴 **제가 못 보고 있을 수 있는 자리**: 프론트가 서버 응답에 담겨 온 URL 을 그대로 부르는 경우, 또는 아직 안 머지된 프론트 브랜치에서 쓰는 경우. 둘 중 하나면 알려주세요 — 제 판정이 틀린 겁니다.

**규모**: `feed` 패키지 21파일 1,605줄 (`S15P21E201-580`, 9/5, janghyojoon).

**그냥 지우면 안 되는 이유**: `feed.domain` 엔티티는 밖에서도 씁니다.
- `auth/service/AccountDeletionService` — 탈퇴할 때 그 사람 피드 행을 JPQL 로 지웁니다
- `user/application/BehaviorPersonalizationReset` — 개인화 초기화가 같은 표를 지웁니다

즉 지운다면 **컨트롤러·서비스·빌더**만 걷어내고 **표와 엔티티는 남겨야** 합니다.

**셋 중 하나만 골라 주세요.**
1. **프론트가 붙일 예정이다** → 그대로 둡니다. 언제쯤인지만 알려주세요
2. **`stories` 로 대체됐다** → 티켓 만들어 컨트롤러·서비스만 걷어냅니다 (표·엔티티 유지)
3. **판단 보류** → 건드리지 않고 이 사실만 문서에 남깁니다

같은 방식으로 **앱이 안 부르는 엔드포인트가 14개** 더 있습니다 — 일정 진행 기록 쓰기 4개(`progress/start`·`pause`·`arrive`·`skip`), facet-view 3개, 분석 KPI, `events/catalog`, `course-categories`, 추천 액션 수정/삭제. 특히 **일정 진행 기록은 읽기(`GET /progress`)만 앱이 부르고 쓰는 쪽을 아무도 안 불러서, 그 데이터가 영영 비어 있습니다.** 이쪽도 궁금하시면 목록 드리겠습니다.
