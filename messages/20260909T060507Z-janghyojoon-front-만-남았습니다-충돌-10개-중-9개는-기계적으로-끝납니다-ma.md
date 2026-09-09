from: janghyojoon
fromEmail: rleaderjoon@gmail.com
to: jinmiri
at: 2026-09-09T06:05:07.213Z
subject: [front 만 남았습니다] 충돌 10개 중 9개는 기계적으로 끝납니다 — map·bigData 에서 방금 푼 요령 그대로

15:20 에 사다리 한 바퀴를 도는데 **`front` 만 남았습니다.** 제가 방금 `map` 과 `bigData` 를 같은 충돌로 풀었으니, **그 요령을 그대로 드립니다.** 5분이면 됩니다.

---

## 1. 지금 상태

```
front/main → main    327커밋 · 🔴 충돌 10개
```

여섯 파트 중 **다섯이 이미 충돌 0** 입니다.

| 파트 | 커밋 | 충돌 | MR |
|---|---|---|---|
| back | 355 | 🟢 0 | `!443` (jaehyeon 님이 푸셨습니다) |
| bigData | 86 | 🟢 0 | `!457` |
| map | 34 | 🟢 0 | `!234` |
| ai | 6 | 🟢 0 | `!444` (kojh0124 님) |
| common | 2 | 🟢 0 | `!458` |
| **front** | **327** | **🔴 10** | — |

---

## 2. 🔴 충돌 열 개 중 아홉은 **기계적으로 끝납니다**

제가 `map`·`bigData` 에서 실제로 겪은 그대로입니다. 걸리는 파일이 정해져 있습니다.

```
CLAUDE.md
.claude/commands/ax-ballot.md
.claude/commands/ax-vote.md
docs/CI.md
docs/HANDOVER.md
docs/ONBOARDING.md
setup.sh
setup.ps1
                        ← 여기까지 여덟은 main 쪽을 그대로 받으면 됩니다
.gitlab-ci.yml          ← 이것만 손으로
frontend/README.md      ← front 쪽(자기 것)을 남기세요
```

**왜 여덟을 main 쪽으로 받나** — 그 파일들의 주인은 `common` 이고, 14:13 에 `common/dev` 가 `main` 에 올라가면서 **`main` 이 최신판**이 됐습니다. front 브랜치에는 8월 판이 남아 있습니다.

🔴 **`CLAUDE.md` 가 16줄로 줄어드는 것에 놀라지 마세요.** 규칙이 사라지는 게 아닙니다 — 8월 31일에 팀 규칙을 `CONTRIBUTING.md`(394줄)로 옮기고 `CLAUDE.md` 는 `@CONTRIBUTING.md` 한 줄짜리 이정표로 남기기로 정했습니다(S15P21E201-508). 제가 대조해서 확인했습니다: 용어 규칙 · axMap npm 이전 · hotfix 예외 · `Pipelines must succeed` 설명이 394줄 안에 **전부** 있습니다. `CONTRIBUTING.md` 는 front 브랜치에 없는 파일이라 **새 파일로 들어옵니다.**

---

## 3. 명령 그대로

```bash
git fetch origin
git switch front/main
git merge origin/main

# ① 공용 문서 여덟은 main 쪽을 받는다
for f in CLAUDE.md .claude/commands/ax-ballot.md .claude/commands/ax-vote.md \
         docs/CI.md docs/HANDOVER.md docs/ONBOARDING.md setup.sh setup.ps1; do
  git checkout --theirs "$f" && git add "$f"
done

# ② 자기 파트 README 는 자기 쪽을 남긴다
git checkout --ours frontend/README.md && git add frontend/README.md

# ③ .gitlab-ci.yml 만 손으로 (4절 참고)
```

> `--theirs` 가 왜 main 쪽인지 — `front/main` 에 서서 `main` 을 **끌어오는** 중이라, 내 쪽이 `ours`(front)이고 들어오는 쪽이 `theirs`(main)입니다.

---

## 4. 🔴 `.gitlab-ci.yml` — 여기만 조심하세요

제가 겪은 충돌 덩어리는 이런 것들이었습니다.

| 덩어리 | 어떻게 |
|---|---|
| 주석 차이 (`jira` 잡 언급 · 한글 파일명 quote 설명) | **main 쪽 받기.** 내용이 같고 main 이 더 자세합니다 |
| **자기 파트 잡이 든 덩어리** | 🔴 **절대 main 쪽으로 받지 마세요** |

`bigData` 에서 실제로 하나 걸렸습니다 — `git config core.hooksPath /dev/null` 한 줄인데, `main` 쪽은 그게 **비어 있어서** 받으면 태그 push 가 다시 죽습니다.

**front 는 `frontend:smoke` 와 `frontend:dependency-scan` 두 잡을 갖고 있습니다.** 풀고 나서 **반드시 개수로 확인해 주세요.**

```bash
grep -c "^frontend:" .gitlab-ci.yml
git show origin/front/main:.gitlab-ci.yml | grep -c "^frontend:"
# → 두 숫자가 같아야 합니다. 다르면 push 하지 말고 알려주세요
```

그리고 front 에는 최상위 `workflow` 키도 있었습니다(파이프라인을 언제 돌릴지 정하는 것). 그것도 살아 있는지 봐 주세요.

```bash
grep -c "^workflow:" .gitlab-ci.yml
```

---

## 5. 🔴 커밋할 때 선점 훅이 막습니다 — 이렇게 넘기세요

머지 커밋은 **바뀐 파일 전부의 claim 을 요구합니다.** 저는 145개, kojh0124 님은 166개였습니다. 훅을 우회하지 말고 **짧게 잡고 바로 반납**하면 됩니다.

```bash
# 스테이징된 것의 최상위 자리만 잡으면 됩니다
P=$(git diff --cached --name-only | awk -F/ '{print $1}' | sort -u | tr '\n' ' ')
npx -y axmap-cli@latest claim $P --task S15P21E201-770 \
    --intent "front/main 에 main 을 합친다 (승격 준비)" --ttl 15m

git commit    # 무엇을 어느 쪽으로 받았는지 본문에 적어 주세요
npx -y axmap-cli@latest release
git push origin front/main
```

🔴 **`--no-verify` 로 훅을 건너뛰지 마세요.** 그러면 감사 기록에 구멍이 남습니다.
🔴 **동시에 여러 파트가 하면 서로 거부당합니다.** 지금은 저도 끝났고 back·ai 도 끝났으니 **front 혼자입니다** — 지금이 가장 좋은 때입니다.

---

## 6. 끝나면

```bash
git fetch origin
git merge-tree --write-tree origin/main origin/front/main | grep -c CONFLICT
# → 0 이어야 합니다
```

0 이 나오면 알려 주세요. **MR 은 제가 올리겠습니다** — 설명에 무엇을 어느 쪽으로 받았는지, 잡 개수 확인 결과를 적어 두겠습니다.

## 7. 못 하셔도 괜찮습니다

**다섯은 이미 준비됐습니다.** front 만 내일 하셔도 오늘의 큰 구멍(main 이 353커밋 뒤처진 것)은 메워집니다. 다만 **`front/main` 이 327커밋으로 가장 많이 벌어져 있어서**, 늦어질수록 충돌이 늘어납니다.

막히시면 그 자리에서 쪽지 주세요. 제가 map·bigData 를 방금 같은 충돌로 풀었으니 바로 답할 수 있습니다.
