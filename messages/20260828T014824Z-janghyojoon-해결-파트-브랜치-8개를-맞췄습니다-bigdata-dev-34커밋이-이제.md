from: janghyojoon
to: all
at: 2026-08-28T01:48:24.744Z
subject: [해결] 파트 브랜치 8개를 맞췄습니다 — bigData/dev 34커밋이 이제 올라갈 수 있습니다 (3명이 던질 수 있음)

앞 쪽지에서 말씀드린 파트 브랜치 문제를 **방금 고쳤습니다.**

## 무엇이 바뀌었나

`front/main` · `front/dev` · `back/main` · `back/dev` · `bigData/main` 다섯 개가
2026-08-25 최초 설정 커밋에 멈춰 있었습니다. `main` 까지 **fast-forward** 했습니다
(다섯 다 `main` 의 조상이라 **잃은 커밋 0**).

그리고 없던 브랜치 셋을 만들었습니다: **`common/main` · `ai/main` · `ai/dev`**.
`common/dev` 와 `feat/ai/…` 는 올라갈 칸 자체가 없었습니다.

이제 열 개 브랜치 **전부** `governance/policy.json` · `ci/axmap/`(18파일) ·
`.gitlab-ci.yml` 을 갖고 있습니다. **지금까지 그쪽으로 가는 MR 에는 아무 검사도 안 돌았습니다.**

## 🟢 bigData/dev 가 열렸습니다 — 던져 주십시오

| | 전 | 후 |
|---|---|---|
| 합의 게이트 | 🔴 **판정 불가** — 타깃에 정책 파일이 없음 | ✅ **미달 0 / 필요 2** (정상 판정) |
| 사다리 | — | ✅ 통과 (`bigData/dev` → `bigData/main`) |
| 던질 수 있는 사람 | — | **3명** — `masdf13` · `yeaseung.lee96` · `jinmiri` |

커밋 저자가 `rleaderjoon` 한 명뿐이라 나머지 세 분이 전부 던질 수 있습니다.

```bash
git fetch origin --quiet
node ci/axmap/governance/gate.mjs --source bigData/dev --target origin/bigData/main
```

AI 도구를 쓰시면 **`/ax-vote bigData/dev`** 입니다.
🔴 다만 `--target` 을 `origin/bigData/main` 으로 주십시오 — `origin/` 을 빼면 낡은
로컬 브랜치를 봅니다.

## 아직 안 풀린 것

**`common/dev`(35커밋)는 여전히 잠겨 있습니다.** 투표권자 4명 중 3명이 이미 커밋해서
던질 수 있는 사람이 1명뿐입니다. 이걸 푸는 것이 앞 쪽지의
**`hotfix/S15P21E201-33-self-vote-tip`** 입니다 — 그 표 2장이 모여야 열립니다.

즉 **부탁드릴 것이 둘입니다:**

1. `hotfix/S15P21E201-33-self-vote-tip` — 2표 (앞 쪽지 참조, 686줄인 이유도 거기 있습니다)
2. `bigData/dev` — 2표
