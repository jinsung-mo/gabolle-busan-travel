from: kojh0124
fromEmail: kojh0124@gmail.com
to: janghyojoon, yeaseung-lee
at: 2026-09-08T00:21:32.407Z
subject: 🔴 [!248 막힌 이유 둘] backend:migration-order 가 아무 말도 없이 죽습니다 (원인 못 찾았습니다) + governance 는 G3 무효 고리입니다

고지혁입니다. `back/dev → back/main` 승격 MR **!248** 이 두 잡에서 막혀 있습니다. 하나는 원인을 찾았고 하나는 **못 찾았습니다** — 못 찾은 쪽을 먼저 적습니다.

파이프라인 182215 (sha `2a830c4a`) 기준입니다.

```
governance                = failed
backend:migration-order   = failed
verify:mr-target          = success
mr:gates                  = success
backend:dependency-scan   = success   ← 이예승 님 -680 고침이 통했습니다
backend:build             = success
claims                    = success
```

---

## 1. `backend:migration-order` — 원인을 못 찾았습니다

### 실측

이 잡은 **한 번도 성공한 적이 없습니다.** 실행 이력이 둘뿐이고 둘 다 !248 입니다.

```
492351  failed  9.3s   refs/merge-requests/248/head  2026-09-08T03:14
492343  failed  13.3s  refs/merge-requests/248/head  2026-09-08T03:08
```

`failure_reason = script_failure` 입니다(타임아웃 아님). 그리고 **로그에 아무것도 없습니다.** `step_script` 구간 전체가 이렇습니다.

```
$ apk add --no-cache git bash
...(패키지 16개 설치)...
OK: 25.1 MiB in 34 packages
$ git fetch origin "$CI_MERGE_REQUEST_TARGET_BRANCH_NAME" --quiet # collapsed multi-line command
section_end:...:step_script
ERROR: Job failed: exit code 1
```

`fatal:` 도 없고 스크립트의 `echo` 도 하나도 안 찍힙니다. **git 이 실패했다면 stderr 가 찍혔을 텐데 그것도 없습니다.**

### 제가 틀렸던 가설 (기록으로 남깁니다)

처음에는 이렇게 봤습니다 — `MAX_EXISTING=$(... | grep -oE 'V[0-9]+' | ...)` 에서 `back/main` 에 마이그레이션이 없으니 `grep` 이 1 로 끝나고, `set -e` 가 그 대입에서 스크립트를 죽인다. 그래서 다음 줄의 `${MAX_EXISTING:-0}` 이 못 돈다.

**직접 돌려 보니 틀렸습니다.** 같은 블록을 `sh -e` 로 같은 두 ref 에 대해 실행하면 **통과하고 `최대 버전: 0` 을 찍습니다.**

```
$ sh -e -c '... 잡의 블록 그대로 ...'
대상 브랜치 기준 최대 버전: 0
SIMULATED EXIT=0
```

파이프라인의 종료 코드는 마지막 명령(`tail -1`)의 것이라 중간 `grep` 실패가 안 잡힙니다(`pipefail` 이 안 켜져 있습니다). 그래서 이 가설은 폐기했습니다.

`git fetch origin back/main --quiet` · `git diff --diff-filter=A origin/back/main 2a830c4` · `git ls-tree` 를 제 PC 에서 같은 ref 로 다 돌려 봤고 **전부 종료 코드 0** 입니다. 즉 **로직으로는 재현이 안 됩니다.** 런너 환경 쪽이라고 보는데 거기까지는 제가 못 봅니다.

### 🔴 부탁 — 한 줄만 넣어 주세요

지금 이 잡은 **자기 로그로 자기를 디버깅할 수 없는 상태**입니다. 원인을 좁히려면 스크립트가 무언가를 말해야 합니다.

```yaml
  script:
    - |
      set -x                                                    # ← 이 한 줄
      echo "target=[$CI_MERGE_REQUEST_TARGET_BRANCH_NAME]"      # ← 또는 이 한 줄
      git fetch origin "$CI_MERGE_REQUEST_TARGET_BRANCH_NAME" --quiet
      ...
```

제가 의심하는 것 둘입니다(둘 다 확인은 못 했습니다).

1. `CI_MERGE_REQUEST_TARGET_BRANCH_NAME` 이 비어 있다 → `git fetch origin ""` — 다만 이러면 git 이 뭔가 찍어야 합니다
2. 런너의 CI clone 이 좁은 refspec 을 쓰므로 `git fetch origin back/main` 이 **`refs/remotes/origin/back/main` 을 안 만든다** → 다음 줄의 `git diff origin/back/main` 이 `bad revision` — 이것도 stderr 가 찍혀야 합니다

`echo` 하나만 있으면 1번이 즉시 갈립니다.

### 🔴 함께 알아 두실 실측 하나 — back/main 에 마이그레이션이 0개입니다

```
back/main : 0
back/dev  : 25
```

`back/main` 에는 **백엔드 마이그레이션이 한 건도 없습니다.** 즉 이번 승격이 25건을 한 번에 옮기는 것이고, 이 검사는 **빈 기준선**을 상대로 비교하게 됩니다. `MAX_EXISTING` 을 0 으로 두는 fallback 이 있는 걸 보면 아예 안 고려한 것은 아닌 듯한데, 그 경로가 실제로 돌아 본 적이 없습니다.

승격 자체를 볼 때도 알아 두실 값이라 적었습니다.

---

## 2. `governance` — 이쪽은 원인이 분명합니다. 표를 더 모아도 안 풀립니다

로그가 스스로 설명합니다.

```
자기 표 : self_vote=(안 적힘 → authors)  author 7명 · tip yeaseung.lee96@gmail.com
표      : 5장  (origin/axmap/votes)
합의 미달 — 유효 찬성 0 / 필요 2
🔴 G1(자기 표 배제)이 해제된 판정입니다 — 유효 투표권자 0명 < 정족수 2. 저자 본인의 표를 셌습니다.

안 센 표
  x jaehyeon        — 헤드가 바뀐 뒤라 효력 없음 (G3)  31cd6946
  x jinmiri         — 헤드가 바뀐 뒤라 효력 없음 (G3)  512e3c90
  x masdf13         — 헤드가 바뀐 뒤라 효력 없음 (G3)  512e3c90
  x yeaseung.lee96  — 헤드가 바뀐 뒤라 효력 없음 (G3)  531ccb2d
  x yeaseung.lee96  — 헤드가 바뀐 뒤라 효력 없음 (G3)  9df8d454
```

**표 5장이 다 있는데 5장 다 무효**입니다. 전부 지금 헤드보다 앞선 커밋에 던져졌고, G3(표는 커밋에 묶인다)이 그걸 버립니다. 도구는 투표권자 전원이 저자인 것까지 감지해서 G1 을 스스로 풀었는데도 유효 찬성이 0 입니다.

🔴 **여기서 중요한 것** — `back/dev` 에 머지가 하나 더 들어가면 그 순간 모아 둔 표가 또 전부 무효가 됩니다. 즉 지금 구조에서는

> 표 2장을 모으는 속도 > `back/dev` 에 머지가 들어오는 속도

가 아니면 승격이 영원히 안 됩니다. 어제 장효준 님이 *"!249 의 표 4장이 무효가 됐습니다"* 라고 보내신 것과 같은 고리이고, 오늘만 세 번째로 보입니다.

제가 판단할 일이 아니라 제안만 적습니다.

| | 무엇 |
|---|---|
| 가 | 승격 MR 을 여는 동안 `back/dev` 머지를 실제로 멈춘다 — 장효준 님이 08:00 에 부탁하신 그것. 사람 합의로만 되고 코드가 안 막아 줍니다 |
| 나 | 승격 전용으로 표를 **범위**가 아니라 **대상 브랜치 tip** 에 묶는다 (G3 완화 — 거버넌스 규칙 변경이라 그 자체로 표가 필요할 겁니다) |
| 다 | 승격을 자동화해서 사람이 표를 던지는 창을 없앤다 |

저는 지금 당장은 **가** 밖에 없다고 봅니다. 다만 오늘 세 번 걸린 걸 보면 나/다 없이는 계속 반복될 것 같습니다.

---

## 3. 겸사겸사 — MCP 쪽지 도구가 지워진 사본을 가리킵니다

이 쪽지를 `ax_send` 로 보내려다 막혔습니다.

```
Error: Cannot find module 'C:\Users\SSAFY\projects\S15P21E201\ci\axmap\tools\bus.mjs'
```

-526 으로 `ci/axmap/` 을 걷어낸 뒤에도 **MCP 서버가 그 경로를 부릅니다.** 저는 `node ~/.axmap/app/tools/bus.mjs post` 로 우회해서 보냈습니다. `axmap doctor` 는 MCP 를 `OK` 로 찍는데(홈에 등록돼 있으니) 실제 쪽지 보내기는 깨져 있습니다 — doctor 가 못 잡는 자리입니다.

에이전트를 쓰는 다른 분들도 같은 데서 막힐 것 같아 알립니다.

---

## 제 쪽 상황

오늘 올린 넷(!292 · !297 · !304 · !308)은 전부 머지됐고, `2a830c4` 에서 다시 빌드·테스트를 돌렸습니다.

```
./gradlew build -x test   종료 코드 0
./gradlew test            종료 코드 0
  tests=778 skipped=340 failures=0 errors=0  → 438건 실제 실행
```

Spring Boot 4.0.8 로 올라간 뒤에도 제 쪽은 깨진 것이 없습니다. 위 두 잡은 제 변경과 무관합니다 — 마이그레이션은 이미 `back/dev` 에 들어가 있고 이번 MR 범위에 제가 새로 추가한 것은 없습니다.

`.gitlab-ci.yml` 은 제가 잡고 있지 않고 제 자리도 아니라 손대지 않았습니다. **`set -x` 한 줄을 제가 넣어 드리는 게 빠르면 말씀만 주세요** — claim 하고 바로 올리겠습니다.
