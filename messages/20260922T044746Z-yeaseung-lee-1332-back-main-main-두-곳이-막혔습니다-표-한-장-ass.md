from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: all
at: 2026-09-22T04:47:46.002Z
subject: 🔴 !1332(back/main → main) 두 곳이 막혔습니다 — 표 한 장 + assistant:href-contract 오탐(back/main 의 낡은 앱 사본을 봅니다)

!1434 가 머지되면서 `back/main` 꼭지가 **`f114712b`** 로 바뀌었고, 그 자리에서 둘이 막혔습니다.

## 1. 표 한 장 (제 것은 던졌습니다)

꼭지가 움직여 앞 표가 전부 G3 로 죽었습니다. 제가 새로 던져 **1/2** 입니다.

```bash
axmap vote --branch back/main --sha f114712b94047ba6c5befecaed91c09bb00e6abe --target main --note "..."
```

꼭지 저자가 **장효준 님**이라 효준 님은 `self_vote=tip` 에 걸립니다. 지혁 님·미리 님·재현 님 중
한 분 부탁드립니다.

> **던지기 전에 이 둘을 반드시 먼저 하세요** — 안 하면 게이트가 «빨개지지 않고 조용히 틀린 답»을 줍니다.
> ```bash
> git fetch origin back/main:back/main
> git -C .axmap/votes fetch origin axmap/votes && git -C .axmap/votes merge --ff-only FETCH_HEAD
> ```
> 오늘 제가 이걸 안 해서 로컬은 「3/2 통과」, CI 는 「1/2 미달」을 봤습니다.

## 2. 🔴 `assistant:href-contract` 가 빨간데, 오탐입니다 (`allow_failure=False` 라 막습니다)

```
서버(working tree) 5개: /plan /trips /field/translate /field/transit /field/exchange-rate
앱  (working tree) 3개: /plan/basic /trips /field/translate
🔴 서버가 내주는데 앱이 모르는 주소 3개: /plan /field/transit /field/exchange-rate
```

**앱은 이미 다 압니다.** 실측했습니다.

| 브랜치 | `ALLOWED_NAVIGATE_HREFS` |
|---|---|
| `front/dev` | `/plan` `/plan/basic` `/trips` `/field/translate` `/field/transit` `/field/exchange-rate` (6개) |
| `front/main` | 위와 같음 (6개) |
| **`back/main`** | `/plan/basic` `/trips` `/field/translate` (3개) ← **낡은 사본** |

### 왜 이렇게 되나

스크립트 머리말에 전제가 적혀 있습니다.

> *「`back/dev` 의 `frontend/` 는 README 한 장짜리 자리표시자이고 … ref 를 안 주면
> working tree 에 파일이 있는 쪽은 그것을 쓴다」*

**그 전제는 `back/dev` 에서만 참입니다.** `back/main` 은 `main` 에서 갈라져 나와
**진짜 `frontend/` 트리를 통째로 들고 있습니다** — 다만 몇 주 낡았습니다. 그래서
`existsSync(APP_FILE)` 가 참이 되고, `DEFAULT_APP_REF = origin/front/dev` 대신
**낡은 사본**을 읽습니다. 잡이 `git fetch origin front/dev` 를 해 두고도 안 씁니다.

> 🔴 **파이프라인을 다시 돌려도 안 고쳐집니다.** `refs/merge-requests/1332/head` 는
> 소스 브랜치(`back/main`)를 체크아웃하므로, `main` 쪽에서 무엇을 머지하든 이 사본은
> 그대로입니다. **!1334 를 먼저 머지해도 이 잡은 계속 빨갛습니다.**

### 실제로 위험한가 — 아닙니다

`!1334`(`front/main → main`)가 들어가면 `main` 의 앱 파일이 6개짜리가 됩니다.
서버가 내주는 5개가 전부 그 안에 있으므로 **배포되는 조합에서는 계약이 성립합니다.**
깨지는 것은 「검사가 보는 그림」뿐입니다.

### 고칠 방향 (제 제안)

working tree 를 앱 쪽 근거로 삼는 것은 **이 MR 이 그 파일을 실제로 바꿨을 때만** 이어야 합니다.
안 바꿨으면 낡은 거울이 아니라 `origin/front/main`(또는 `front/dev`)을 봐야 합니다.
한 줄짜리 조건입니다.

**그런데 고침이 `back/main` 에 닿아야 이 MR 이 풀립니다.** 사다리상
`hotfix/…` 도 `<파트>/main` 으로는 못 가므로 `back/dev → back/main` 승격을 한 번 더 돌아야 합니다.
승격 한가운데서 그 고리를 도는 게 맞는지는 제가 혼자 정할 일이 아니라고 봅니다.

**선택지 셋**
1. 지금은 `!1334`·`!1333` 만 머지하고, `!1332` 는 검사 고침을 태워 `back/dev → back/main` 을 한 번 더 돌린 뒤에 올린다 *(제가 권하는 쪽)*
2. `assistant:href-contract` 를 한시적으로 `allow_failure: true` 로 내린다 — 빠르지만 **다음 진짜 위반도 같이 놓칩니다**
3. `back/main` 의 낡은 `frontend/` 사본을 front 쪽 최신으로 맞춘다 — 근본적으로 거울을 없애는 일이라 이 자리에서 할 일은 아닙니다

1397 을 만드신 진성 님, 그리고 `back/main` 꼭지 저자이신 효준 님 의견 주시면 그대로 따르겠습니다.

## 지금 상태 정리

| MR | 표 | CI | 남은 것 |
|---|---|---|---|
| !1334 `front/main → main` | ✅ 2/2 (`governance` 초록) | 도는 중 | 빌드만 끝나면 머지 가능 |
| !1333 `bigData/main → main` | ✅ 2/2 (`governance` 초록) | 도는 중 | 같음 |
| !1332 `back/main → main` | ⚠️ 1/2 | 🔴 href-contract | 표 한 장 + 위 결정 |
| !1331 `ai/main → main` | ✅ 3/2 | 초록 | 🔴 충돌 — 올릴 것이 없는 MR (닫는 게 맞다고 봅니다) |
