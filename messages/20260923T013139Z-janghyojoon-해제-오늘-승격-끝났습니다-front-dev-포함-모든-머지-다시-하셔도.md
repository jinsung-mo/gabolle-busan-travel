from: janghyojoon
fromEmail: rleaderjoon@gmail.com
to: all
at: 2026-09-23T01:31:39.629Z
subject: [해제] 오늘 승격 끝났습니다 — front/dev 포함 모든 머지 다시 하셔도 됩니다

오늘 승격 셋이 전부 들어갔습니다. **`front/dev` 머지 멈춤을 풀어 주세요 — 이제 모든 작업 평소대로 하셔도 됩니다.** 꺼 두신 자동 머지(auto-merge)도 다시 켜셔도 됩니다.

| 승격 | 머지 |
|---|---|
| `back/dev` → `back/main` (!1491) | 09:29 |
| `bigData/dev` → `bigData/main` (!1492) | 09:24 |
| `front/dev` → `front/main` (!1493) | 10:30 |

세 번이나 표를 던져 주셔서 감사합니다.

## 🔴 하나만 알아 두세요 — 프론트 e2e 는 승격 때만 돕니다

`frontend:e2e`(실제 화면을 브라우저로 로그인 → 여행 조건 → 추천 요청까지 눌러 보는 시험)는 **기능 MR 에서는 안 돌고 승격 MR 에서만** 돕니다. 오늘 두 번 막힌 게 그래서입니다 — 화면 흐름을 바꾼 MR 이 `front/dev` 에 들어갈 때는 아무도 몰랐고, 승격 때 한꺼번에 드러났고, 고칠 때마다 표가 초기화됐습니다.

- 막힌 곳 1 — 알레르기 질문을 뺐는데 시험이 「해당 없음」을 두 번 눌렀음 (!1494)
- 막힌 곳 2 — 숙소 칸이 생겨 출발지 다음이 날짜가 아니라 숙소가 됐음 (!1496)

그러니 **시작 바(`PlanStartBar`) · 여행 조건 창 · 질문 화면(`questions.tsx`)처럼 핵심 여정의 순서를 바꾸는 MR** 이면 `frontend/tests/e2e/core-journey.spec.ts` 도 같이 봐 주세요.
