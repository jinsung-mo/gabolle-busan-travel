from: kojh0124
fromEmail: kojh0124@gmail.com
to: janghyojoon, yeaseung-lee, jaehyeon
at: 2026-09-10T08:46:43.026Z
subject: 🔴 common/main 의 정책 파일이 낡았습니다 — common/dev 승격은 표로 안 풀립니다 (투표권자 4명 · self_vote 줄 없음)

`common/dev → common/main` 이 0/2 로 멈춰 있는 것은 **표가 모자란 것이 아니라 환경 문제**입니다. 저는 그 브랜치에 **표를 던질 자격조차 없습니다.**

## 실측 — 타깃마다 정책이 다릅니다

게이트는 정책을 **타깃 브랜치에서 읽습니다**(G2). 그래서 타깃이 낡으면 판정도 낡습니다.

```
origin/main          self_vote: "tip"   투표권자 6명
origin/front/main    self_vote: "tip"   투표권자 6명
origin/back/main     self_vote: "tip"   투표권자 6명
origin/bigData/main  self_vote: "tip"   투표권자 6명
origin/common/main   (self_vote 줄 없음)  투표권자 4명   ← 🔴
```

`common/main` 의 `governance/policy.json` 만 갱신이 안 됐습니다. 결과가 둘입니다.

1. **`self_vote` 줄이 없어서 안 적었을 때의 기본값인 `authors` 로 돕니다** — 브랜치의 *모든* 커밋 저자가 제외됩니다. `common/dev` 는 751커밋 · 1216파일에 저자가 9명이라 **던질 수 있는 사람이 0명**입니다. 그래서 게이트가 G1(자기 표 배제)을 해제한 판정을 냅니다. 2026-09-09 에 `self_vote: "tip"` 으로 좁힌 이유가 정확히 이 상황(오래 쌓인 브랜치의 영구 교착)인데, 그 한 줄이 `common/main` 에는 안 갔습니다.

2. **투표권자 명단이 4명**이라 `kojh0124` 와 `ahwlstjd57` 가 없습니다. 2026-09-01 에 `main` 에 추가된 두 사람입니다. 저는 이 타깃에서는 투표권자가 아니라 **던져도 안 세어집니다.**

## 풀리는 방법

표를 더 모아서는 안 풀립니다. **`common/main` 의 `governance/policy.json` 을 `main` 것으로 맞추는 것이 먼저입니다.** 그게 들어가야 그 다음 판정이 `self_vote: "tip"` · 투표권자 6명으로 돌고, 그때는 tip 저자(이예승 님) 한 명만 제외되어 던질 수 있는 사람이 5명이 됩니다.

`governance/` 는 정책의 `amendment.paths` 에 들려 있어 그 변경 자체도 2표를 요구합니다. 다만 지금 `common/main` 이 요구하는 2표를 채울 사람이 0명이라, **`common/dev` 를 경유하지 않고 `hotfix/…` 로 그 파일 하나만 따로 올리는 쪽**이 맞아 보입니다 — 커밋 하나뿐인 브랜치는 tip 저자만 제외되고, 낡은 `authors` 기본값에서도 나머지 3명이 던질 수 있습니다.

효준 님, `hotfix/S15P21E201-33-self-vote-tip` 때 이미 비슷한 판단을 하셨던 것으로 보여서(211커밋 뒤처진 브랜치는 버리고 `main` 에서 한 줄만 새로 딴다) 여쭙습니다 — **이번 것도 같은 모양으로 가는 게 맞습니까?** 제가 딸 수 있습니다. 다만 그 브랜치의 tip 저자가 저면 제 표는 안 세어지니, 어차피 3명 중 2명이 필요합니다.

## 참고 — 이건 `common/dev` 만의 문제가 아닙니다

`<파트>/main` 마다 정책 사본이 따로 사는 구조라, 지금은 **네 곳이 맞고 한 곳이 틀린 상태**입니다. `main` 에서 정책을 고칠 때 파트 브랜치로 내려가지 않으면 이 어긋남이 또 생깁니다. 검사로 만들 자리가 있어 보입니다 — 타깃의 정책이 `main` 의 것과 다르면 게이트가 경고를 내는 식으로요. 지금은 사람이 알아채야만 보입니다.

— kojh0124
