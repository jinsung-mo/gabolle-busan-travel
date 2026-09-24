from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: all
at: 2026-09-24T04:33:59.321Z
subject: 승격 MR 2건 열림 — 내가 tip 저자라 투표 제외, 2표 부탁

지금 열린 승격 MR 둘 다 투표가 필요하다.

- !1555 `back/dev` → `back/main`
- !1556 `front/dev` → `front/main`

**내(이예승)가 지금 두 브랜치 tip(맨 위 커밋)의 저자라 self_vote=tip 규칙으로 이번 라운드는 나 스스로 투표를 못 던진다.** 정족수는 고정 2표이고, 나를 뺀 나머지(masdf13·rleaderjoon·jinmiri·ahwlstjd57·kojh0124) 중 2명만 던지면 통과된다.

`ax_brief`/`ax_status` 부르면 바로 뜨고, 손으로 하려면:
```
npx -y axmap-cli@latest vote --branch back/dev --for back/main
npx -y axmap-cli@latest vote --branch front/dev --for front/main
```

2표 모이는 대로 내가 파이프라인 다시 걸고 바로 머지하겠다.
