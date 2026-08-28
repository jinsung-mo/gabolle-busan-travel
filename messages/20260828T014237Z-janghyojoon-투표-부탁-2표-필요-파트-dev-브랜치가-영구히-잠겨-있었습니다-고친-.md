from: janghyojoon
to: all
at: 2026-08-28T01:42:37.945Z
subject: [투표 부탁 · 2표 필요] 파트 dev 브랜치가 영구히 잠겨 있었습니다 — 고친 브랜치를 올렸습니다 (🔴 686줄인 이유도 함께)

## 무엇을 투표하나

브랜치 `hotfix/S15P21E201-33-self-vote-tip` · 커밋 `7718cab` → 최상위 `main`

**던질 수 있는 분 3명**: `masdf13` · `yeaseung.lee96` · `jinmiri`
**필요한 표 2장** · 현재 **0장**

(저 `rleaderjoon` 은 이 브랜치를 만든 사람이라 못 던집니다 — 자기 표 배제)

---

## 왜 필요한가 — 실측입니다

정족수를 세는 규칙에 **"자기가 커밋한 브랜치에는 자기 표를 못 던진다"** 는 조항이 있습니다.
커밋 하나짜리 브랜치에서는 맞는 말인데, **몇 주씩 쌓는 `<파트>/dev` 브랜치에서는 시간이
갈수록 던질 수 있는 사람이 줄어듭니다.**

| 브랜치 | 커밋 | 커밋한 사람 | 던질 수 있는 사람 | 필요 | |
|---|---|---|---|---|---|
| `common/dev` | 35 | **3명** | **1명** | 2표 | 🔴 **영구히 잠김** |
| `bigData/dev` | 34 | 2명 | 2명 | 2표 | ⚠️ 여유 0 |

`common/dev` 는 투표권자 4명 중 3명이 이미 커밋해서 **표를 아무리 모아도 못 엽니다.**
"아직 표가 모자란 것" 이 아니라 **수학적으로 도달 불가**입니다.

**고침:** 배제 범위를 *"모든 커밋 저자"* 에서 *"맨 위 커밋 저자 한 명"* 으로 좁힙니다.
`common/dev` 의 던질 수 있는 사람이 **1명 → 3명**이 됩니다.

*"혼자 올리고 혼자 통과"* 는 **여전히 막힙니다** — 머지될 커밋을 만든 사람은 못 던집니다.

---

## 🔴 미리 말씀드립니다 — 커밋이 **686줄**입니다

진짜 정책 변경은 **`governance/policy.json` 4줄**입니다:

```json
"self_vote": "tip",
```

나머지 682줄은 **`main` 이 뒤처져 있어서 같이 딸려 온 것**입니다.
`main` 의 선점 도구 사본이 두 세대 낡았습니다 (`4556679` → `6d9fe68`).
그래서 그 사이 변경(쪽지 기능 `bus.mjs` +167, MCP 서버 +170, `axmap.mjs` +104 등)이
함께 실렸습니다. **전부 이미 `common/dev` 에서 돌고 있던 것들**이지만 `main` 에는 처음 들어갑니다.

**4줄이 아니라 686줄을 승인하시는 것**이니 그렇게 알고 보십시오.

---

## 던지는 법

```bash
git fetch origin --quiet
git fetch origin refs/heads/axmap/votes:refs/remotes/origin/axmap/votes --force

# 무엇이 바뀌는지 먼저 보십시오
git diff --stat origin/main origin/hotfix/S15P21E201-33-self-vote-tip
git diff origin/main origin/hotfix/S15P21E201-33-self-vote-tip -- governance/policy.json

# 던지기
node ci/axmap/governance/vote.mjs \
  --branch hotfix/S15P21E201-33-self-vote-tip \
  --sha 7718cabc125906785c287159f54c21d578a0f645 \
  --vote approve --target origin/main \
  --note "<확인하신 내용을 한 줄로>"
```

AI 도구를 쓰시면 **`/ax-vote hotfix/S15P21E201-33-self-vote-tip`** 한 줄이면 됩니다 —
바뀌는 것을 보여주고 확인을 받은 뒤에 던집니다.

---

## 🔴 그 브랜치에 커밋을 더 올리지 마십시오

**표는 커밋 하나에 묶입니다.** 오타 하나를 고치는 커밋이라도 올라가면 **앞서 모인 표가
전부 효력을 잃습니다.** 고칠 것이 보이면 먼저 쪽지를 주십시오.

---

## 곁들여 — 파트 브랜치 다섯 개가 비어 있습니다

같이 실측하다 나온 것입니다. **`front/main` · `front/dev` · `back/main` · `back/dev` ·
`bigData/main`** 이 2026-08-25 최초 설정 커밋에 멈춰 있고, 거기엔
**`governance/` 도 `ci/axmap/` 도 `.gitlab-ci.yml` 도 없습니다.**

즉 그 브랜치들로 가는 MR 은 **아무 검사도 안 돌고**, 합의 게이트는 정책 파일을 못 찾아
*"판정 불가"* 를 냅니다. `bigData/dev` 의 34커밋이 못 올라가는 진짜 이유가 이것입니다.

다섯 개 다 `main` 의 **조상**이라 fast-forward 로 따라잡을 수 있습니다(잃는 커밋 0).
곧 맞추겠습니다.
