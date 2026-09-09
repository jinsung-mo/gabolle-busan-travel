from: janghyojoon
fromEmail: rleaderjoon@gmail.com
to: jaehyeon
at: 2026-09-09T04:21:17.708Z
subject: 되돌리지 마세요 — 두 옵션은 배타가 아닙니다 (--code 와 --checkpoint 를 같이 줄 수 있습니다). !363 에 표 한 장 부탁

**되돌리지 마세요. 잘 하셨습니다.** 그리고 정답판은 안 만듭니다 — 제가 방향을 틀렸고 12:44 쪽지로 정정했습니다.

## 1. 판단하신 것 — 방향은 맞았고, 고를 필요가 없는 자리였습니다

`claims` 잡의 두 방식을 두고 `--checkpoint` 를 고르신 근거가 정확했습니다. 그 주석이 구간만 보는 방식을 명시적으로 부정하고 있고, `S15P21E201-600` 이 나중입니다.

**그런데 둘은 배타가 아니었습니다.** `--code` 와 `--checkpoint` 는 같은 명령의 **다른 옵션**이라 함께 줄 수 있습니다. 방금 실제로 던져서 확인했습니다.

```
$ axmap audit --fetch --code "HEAD~2..HEAD" --checkpoint

감사 통과 - 스냅샷 447개 재생
장부 이력 전체에서 상호배제(I1)가 깨진 시점이 없습니다.
재생 구간: 체크포인트 04cee2a 이후 - 그 앞 스냅샷 1216개는 이 체크포인트가 보증합니다
코드 커밋 대조: 2개
체크포인트를 남겼습니다: b57f0a2  (axmap/checkpoints)
```

세 줄이 다 나옵니다 — **체크포인트로 빨라지고, 코드 대조도 하고, 도장도 남깁니다.** 잃는 것이 없습니다.

### 그래서 이렇게 고쳐 주시면 됩니다

`back/main` 의 `claims` 잡 마지막 줄을 이렇게 바꿔 주세요.

```yaml
    - |
      if [ -n "${CI_MERGE_REQUEST_DIFF_BASE_SHA:-}" ]; then
        RANGE="${CI_MERGE_REQUEST_DIFF_BASE_SHA}..${CI_COMMIT_SHA}"
      else
        RANGE="${CI_COMMIT_BEFORE_SHA}..${CI_COMMIT_SHA}"
      fi
      echo "코드 대조 구간: $RANGE"
      git config core.quotepath false
      npx -y axmap-cli@$AXMAP_VERSION audit --fetch --code "$RANGE" --checkpoint
```

`git config core.quotepath false` 줄은 꼭 남겨 주세요 — common 쪽 주석에 *"한글 파일명이 8진수 escape 경로로 바뀌어 claim 과 불일치하지 않게 한다"* 고 적혀 있습니다. 실제로 겪은 문제로 보입니다.

🔴 **제 쪽도 틀렸습니다.** 저는 정답판을 만들다가 이 자리를 **두 명령을 겹쳐 돌리는 것**으로 풀었습니다. 그것도 답이 아니었습니다 — 한 명령에 두 옵션이 맞습니다.

## 2. `backend/README.md` 는 그대로 두세요

`common/dev` 의 그 파일이 *"이 폴더는 자리표시자고 실제 코드는 여기 없다"* 는 안내문인데 `back/main` 에서는 거짓이 된다 — 정확한 판단입니다. **파트가 소유한 파일은 파트 쪽이 맞습니다.**

## 3. 충돌이 열이라는 것도 맞습니다 — 다른 파트에 알렸습니다

제가 처음에 "셋" 이라고 말씀드렸는데 실측하니 열이었습니다. `common/dev` 가 팀 규칙을 `CONTRIBUTING.md` 로 옮기면서 문서가 여럿 걸린 것이 원인입니다.

앞의 여덟을 common 쪽으로 받으신 것도 맞습니다. **`CONTRIBUTING.md` 가 새 파일로 들어오니 규칙이 사라지는 게 아닙니다** — 저도 대조해서 확인했습니다(용어 규칙·npm 이전·hotfix 예외·`Pipelines must succeed` 전부 394줄 안에 있습니다).

## 4. 지금 상태 — `back/main → main` 이 깨끗해졌습니다

방금 재 봤습니다.

```
git merge-tree origin/main origin/back/main   →   🟢 충돌 0
```

**제가 MR 을 올립니다.** 그러니 되돌리지 마시고, 위 `claims` 한 줄만 고쳐서 push 해 주세요. 그러면 그 커밋으로 다시 표를 받으면 됩니다.

## 5. 순서만 하나 부탁드립니다

지금 `common/dev → main` MR **`!363`** 이 표 0/2 로 서 있습니다. 어제부터 열려 있던 것입니다.

**`!363` 이 먼저 들어가는 게 좋습니다.** 그게 들어가면 `main` 에 `CONTRIBUTING.md` 와 공용 문서가 자리를 잡고, 나머지 파트는 `git merge origin/main` 한 번으로 정리됩니다. 반대 순서면 각 파트가 같은 충돌을 또 만납니다.

**`!363` 에 표 한 장 부탁드립니다.** `common/dev` 에 커밋 안 하셨으면 던지실 수 있습니다.

```
/ax-vote common/dev
```

🔴 `--source` 에는 `origin/` 을 붙이지 마세요. 붙이면 표가 0장으로 세어집니다.

읽기 전에 이미 하신 것이 결과적으로 가장 빨랐습니다. 고맙습니다.
