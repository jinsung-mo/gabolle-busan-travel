from: janghyojoon
fromEmail: rleaderjoon@gmail.com
to: all
at: 2026-09-09T08:14:33.168Z
subject: 🟢 [재개해도 됩니다] main 이 오늘치를 다 받았습니다 — 각자 3분, 브랜치마다 할 일이 다릅니다

🟢 **끝났습니다. 받아가시고 작업 재개하셔도 됩니다.** 각자 3분입니다.

## 1. 지금 `main` 에 다 들어가 있습니다

```
back 385커밋 · map 35 · bigData 86 · common 12 · ai(내용상 반영됨)
+ CI 검사를 파트별 파일로 가르는 뼈대
+ 설문 응답 DB 백업 (그동안 아무 백업에도 없었습니다)
+ 샘플 DAG 이 코어를 태우던 것 둘
```

아침에 `main` 이 **353커밋 뒤처져** 있었고, `front/main → main` 은 **저장소 역사상 한 번도 없었습니다.**

## 2. 각자 할 일 — **브랜치마다 다릅니다**

| 브랜치 | 상태 | 할 일 |
|---|---|---|
| `back/main` · `back/dev` | 🟢 앞선 커밋 0 · 충돌 0 | **빨리감기.** 아래 두 줄 그대로 |
| `bigData/main` · `bigData/dev` | 🟢 앞선 커밋 0 · 충돌 0 | 같음 |
| `common/dev` | 🟢 앞선 커밋 0 · 충돌 0 | 같음 |
| `map/main` · `map/dev` | ✅ **제가 이미 했습니다** | 없음 |
| `ai/main` | 앞섬 6 · 충돌 0 · **파일 차이 0** | `git merge origin/main` 한 번 |
| **`ai/dev`** | 앞섬 4 · 🔴 **충돌 2** | 아래 3절 |
| **`front/main` · `front/dev`** | 앞섬 327/363 · 🔴 **충돌 10** | 아래 4절 |

> **빨리감기** — 내 브랜치에만 있는 커밋이 하나도 없을 때, 머지 커밋을 만들지 않고 **표지판만 앞으로 옮기는 것.** 충돌이 날 수가 없습니다.

```bash
git fetch origin
git switch <파트>/main && git merge origin/main         && git push origin <파트>/main
git switch <파트>/dev  && git merge origin/<파트>/main   && git push origin <파트>/dev
```

🔴 **`dev` 까지 받으셔야 합니다.** `main` 만 받으면 다음 승격에서 오늘 푼 충돌을 또 만납니다.

## 3. 🔴 `ai/dev` — 충돌 둘, 답이 정해져 있습니다 (고지혁 님)

```
CLAUDE.md
governance/policy.json
```

**둘 다 `main` 쪽을 받으시면 됩니다.**

```bash
git switch ai/dev && git merge origin/ai/main
git checkout --theirs CLAUDE.md governance/policy.json
git add CLAUDE.md governance/policy.json
```

앞서 있는 4커밋이 **투표권자 명단 추가**와 **죽은 검사 명령 고침**인데, 둘 다 이미 `main` 에 더 새 판으로 들어가 있습니다. `CLAUDE.md` 가 16줄로 줄어드는 것에 놀라지 마세요 — 팀 규칙은 8월 31일에 `CONTRIBUTING.md`(394줄)로 옮겼고 `CLAUDE.md` 는 이정표만 남깁니다.

## 4. 🔴 `front` — 여기만 아직 안 올라갔습니다 (진미리 님)

`front/main` 이 `main` 보다 **327커밋 앞서 있고 충돌이 10개**입니다. **받아가기와 올리기가 같은 작업**입니다 — 충돌을 푸시면 그 상태로 `main` 에 올리시면 됩니다.

요령은 15:05 쪽지에 그대로 있습니다. 아홉은 「main 쪽 받기」로 기계적으로 끝나고, **`.gitlab-ci.yml` 만 손으로** 푸시면 됩니다. 🔴 **`frontend:` 로 시작하는 잡 개수를 풀기 전후로 세어 보세요** — 그게 없어지면 프론트 검사가 조용히 사라집니다.

**다른 파트는 `front` 를 기다리지 않으셔도 됩니다.**

## 5. 🔴 받다가 이렇게 막히면 — 제가 방금 겪었습니다

```
error: The following untracked working tree files would be overwritten by merge:
	bigData/docs/HOTSPOT-SCORE.md
	...
```

**git 에 안 올린 파일이 같은 자리에 있으면 받기를 거부합니다.** 지우지 마시고 **딴 데로 옮기신 뒤** 받으세요. 받고 나서 내용이 같으면 버리시면 됩니다.

```bash
mkdir -p ~/backup-untracked
git status --porcelain --untracked-files=all <막힌폴더>/ | sed 's/^?? //' \
  | while read -r f; do mkdir -p ~/backup-untracked/$(dirname "$f"); mv "$f" ~/backup-untracked/"$f"; done
```

## 6. 🟢 앞으로 달라지는 것 — CI 공책이 갈렸습니다

`.gitlab-ci.yml` 한 파일에 여섯 파트 검사가 다 있던 것을 **`ci/parts/<파트>.yml` 여섯 권으로 갈랐습니다.** 지금은 여섯 권이 **비어 있고**, 각자 자기 검사를 자기 파일로 옮기시면 됩니다.

**서로 다른 파일이라 여섯 명이 동시에 하셔도 안 부딪힙니다.** 절차는 `docs/CI-SPLIT.md` 에 있습니다. 급하지 않습니다 — 다음에 CI 를 건드릴 일이 생기면 그때 옮기세요.

🔴 **파일이 비면 include 가 거부합니다.** 그래서 여섯 권에 **숨은 잡**(이름이 점으로 시작하면 잡으로 안 만들어집니다) 한 줄씩 넣어 뒀습니다. 첫 잡을 옮겨 오면 그 줄은 지우셔도 됩니다.

## 7. 남은 숙제 셋 — 오늘은 안 합니다

| | |
|---|---|
| **버전 폭주** | 오늘만 `v4 → v12`. **여섯 파트가 한 카운터를 다투는 것**이 원인입니다 |
| **선점 위반 93건** | `back` 브랜치에만 있습니다. 다른 파트는 **전부 0건**. 검사는 CI 변수 뒤로 잠시 꺼 뒀습니다 — 내역은 `docs/26.09.09/선점-감사-위반-75건.md` |
| **규칙이 브랜치마다 다름** | 투표 규칙이 파트마다 다른 판이라 오늘 표가 52장 무효가 됐습니다 |

## 8. 🔴 코드가 빨간 MR 셋 — 작성자만 고칠 수 있습니다

| MR | 무엇이 빨간가 |
|---|---|
| `!459` 취향 벡터 (고지혁 님) | `RouteAuthorizationRegistryTest` 하나 실패 — **새 경로를 인가 정책 표에 안 적으셨습니다.** 1,143개 중 1개 |
| `!387` SPEND_PROFILE (모진성 님) | `backend:build` · `backend:migration-order` 둘 다 |
| `!451` 익명 여행 승계 (모진성 님) | 파이프라인 실패 |

**표가 아니라 코드입니다.** 표를 더 모아도 안 풀립니다.

---

기다려 주셔서 고맙습니다. 오늘 각자 5~10분씩 쓰신 것 덕분에 **13일치가 한 번에 메워졌습니다.**
