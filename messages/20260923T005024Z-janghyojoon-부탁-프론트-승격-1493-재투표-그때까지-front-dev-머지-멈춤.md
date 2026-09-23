from: janghyojoon
fromEmail: rleaderjoon@gmail.com
to: all
at: 2026-09-23T00:50:24.324Z
subject: [부탁] 프론트 승격(!1493) 재투표 + 그때까지 front/dev 머지 멈춤

## 요청 둘

**1. !1494 가 머지된 뒤부터 !1493 이 머지될 때까지 `front/dev` 에 아무것도 머지하지 말아 주세요.**
MR 을 여는 건 괜찮습니다. 자동 머지(auto-merge)를 켜 둔 MR 이 있으면 잠깐 꺼 주세요 — 검사가 끝나는 순간 들어가 버립니다.

**2. !1494 가 머지된 «뒤에» `front/dev` → `front/main` 에 다시 투표해 주세요. 2표가 필요합니다.**
오늘 아침에 던져 주신 4표(jinmiri · kojh0124 · masdf13 · yeaseung.lee96)는 !1494 가 들어가는 순간 효력을 잃습니다 — 표는 커밋 하나에 묶여 있습니다.
장효준은 !1494 를 머지하는 사람이라 이번엔 표를 못 던집니다(맨 위 커밋을 만든 사람은 자기 표가 안 셉니다).

```bash
git fetch origin
git fetch origin refs/heads/axmap/votes:refs/remotes/origin/axmap/votes
npx -y axmap-cli@latest vote --branch front/dev --sha $(git rev-parse origin/front/dev) \
  --vote approve --target origin/front/main --note "<20자 이상 — 무엇을 봤는지>"
```
(Claude Code 를 쓰면 `/ax-vote front/dev`)

## 왜

- 프론트 승격 MR !1493 의 `frontend:e2e`(실제 화면을 브라우저로 끝까지 눌러 보는 시험)가 **매번** 실패합니다. 알레르기 질문을 여행 조건 창에서 뺐는데(S15P21E201-1497), 시험은 「해당 없음」을 두 번(알레르기·식단) 누르고 있었습니다
- 같은 이유로 질문 화면도 아직 알레르기 답을 요구해서, 마지막 질문에 경고가 늘 뜨고 만들기를 누르면 조건 창이 한 번 더 떴습니다
- 둘 다 고친 것이 **!1494**(S15P21E201-1513)입니다. !1493 은 `front/dev` 를 그대로 옮기는 MR 이라, 이게 `front/dev` 에 먼저 들어가야 초록이 됩니다

## 참고

- 백엔드 승격(!1491)·빅데이터 승격(!1492)은 오늘 아침 표로 이미 머지됐습니다. 감사합니다
- 표가 파이프라인보다 늦게 오면 정족수 검사가 빨갛게 남습니다(표는 MR 밖에서 와서 스스로 다시 안 셉니다). 그건 제가 그 검사만 다시 돌립니다 — 빈 커밋은 올리지 마세요, 표가 또 무효가 됩니다
