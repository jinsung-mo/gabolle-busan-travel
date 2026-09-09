from: janghyojoon
fromEmail: rleaderjoon@gmail.com
to: all
at: 2026-09-09T03:44:41.450Z
subject: [🔴 정정 · 표 두 장만] 정답판 안 만듭니다 — MR !363 (common/dev→main, 충돌 0) 에 표 부탁드립니다

🔴 **앞 쪽지 둘을 정정합니다. 파트 담당자가 지금 할 일은 없습니다. 표 두 장만 필요합니다.**

---

## 1. 무엇이 바뀌었나 — 제가 방향을 잘못 잡았습니다

앞서 *"공용 파일 정답판을 하나 만들어 나눠 드릴 테니 그걸 복사하세요"* 라고 했습니다. **그렇게 하면 안 됩니다.**

만들다가 알았습니다 — 파트마다 **자기 검사 잡을 `.gitlab-ci.yml` 한 파일에** 넣어 뒀습니다.

```
back    +350줄   backend:build · migration-order · dependency-scan …
front   +212줄   frontend:smoke · dependency-scan …
bigData  +68줄   verify:bigdata
map      +43줄
common  +194줄   promote · vote:recheck · status · jira …
```

**제가 정답판을 만들어 나누면, 어느 파트의 잡이 조용히 사라져도 아무도 모릅니다.** 자기 파트 잡이 다 있는지는 **그 파트 담당자만** 판단할 수 있습니다. 남이 대신 풀 일이 아니었습니다.

그리고 실제로 만들다가 두 번 실패했습니다 — 한 번은 파일이 비어 버렸고, 한 번은 선점 훅이 막았습니다(머지가 수천 파일을 스테이징하니까요). **틀린 방향이었다는 신호였습니다.**

---

## 2. 그래서 원래 사다리대로 한 칸씩 갑니다

### 오늘 첫 칸 — **MR `!363`** (어제부터 열려 있었습니다)

```
common/dev → main     202커밋 · 🟢 충돌 0 · 표 0/2
https://lab.ssafy.com/s15-bigdata-dist-sub1/S15P21E201/-/merge_requests/363
```

**여섯 중 충돌이 없는 유일한 MR 입니다.** 어제 열어 뒀는데 표가 한 장도 안 들어와서 그대로 서 있었습니다.

### 이게 들어가면 무엇이 해결되나

```
infra/personalization/     ← 고지혁 님이 못 봐서 중복으로 만든 그것
survey-recommend/          ← 제가 못 봐서 중복으로 만든 그것 (1,016줄 버렸습니다)
survey-place/
CONTRIBUTING.md            팀 규칙 본문 394줄
docs/ 40개 · ci/status/
```

**오늘 난 중복 사고 세 건 중 두 건이 이 브랜치를 못 본 탓입니다.** 이것만 올라가도 그 둘은 막힙니다.

### 그다음 칸은 담당자가 각자, 서두르지 않고

`!363` 이 머지된 뒤에 하시면 됩니다. **점심 동안 안 하셔도 됩니다.**

```bash
git switch <자기파트>/main
git merge origin/main       # .gitlab-ci.yml 충돌 → 🔴 양쪽 잡을 다 남긴다
                            #   자기 파트 잡 개수를 세서 확인하세요
git push origin <자기파트>/main
```

그러면 그 파트 MR 은 충돌 없이 올라갑니다. 순서가 이러니 **오늘 다 못 돌아도 괜찮습니다** — `main` 이 202커밋 따라잡는 것만으로 오늘의 큰 구멍은 메워집니다.

---

## 3. 🔴 부탁 — 표 두 장

```
/ax-vote common/dev
```

- 🔴 `--source` 에는 `origin/` 을 **붙이지 마세요.** 붙이면 표가 0장으로 세어집니다. `--target` 에는 붙입니다
- `common/dev` 에 커밋한 분은 **자기 표를 못 던집니다.** 안 던지신 분이 두 분만 있으면 찹니다

### 표 던지기 전에 이것만 봐 주세요 — `CLAUDE.md` 가 16줄로 줄어듭니다

**규칙이 사라지는 것이 아닙니다.** 2026-08-31 에 팀 규칙을 `CONTRIBUTING.md`(394줄)로 옮기고 `CLAUDE.md` 는 `@CONTRIBUTING.md` 한 줄짜리 **이정표**로 남기기로 정했습니다(S15P21E201-508).

제가 오늘 대조해 확인했습니다 — 용어 설명 규칙 · axMap npm 이전 · hotfix 예외 · `Pipelines must succeed` 설명이 **394줄 안에 전부 있습니다.** 파트 브랜치에는 `CONTRIBUTING.md` 가 없어서 이 MR 로 새 파일로 들어옵니다.

MR 설명에 더 자세히 적어 뒀습니다.

---

## 4. 에이전트에게는 이것만 시키면 됩니다

앞 쪽지의 긴 프롬프트는 **버려 주세요.** 정답판을 기다리게 만들어 놨는데 그 정답판을 안 만듭니다.

대신 이것만:

```
MR !363 (common/dev → main) 의 정족수를 5분마다 확인해라.

  npx -y axmap-cli@latest gate --source common/dev --target origin/main

🔴 --source 에 origin/ 을 붙이지 마라. 붙이면 표가 0장으로 세어진다.

"합의 충족" 이 나오면:
  1. MR !363 의 governance 잡을 retry 한다 — 표는 MR 밖의 브랜치로 들어오므로
     GitLab 이 파이프라인을 자동으로 다시 돌리지 않는다. 화면에 옛 판정이 남아 있다
  2. 초록이 되고 mergeable 이면 머지한다
     🔴 판정에 쓴 커밋 sha 를 실어라
     🔴 should_remove_source_branch = false — common/dev 를 지우면 안 된다
  3. 머지 뒤 사후 파이프라인을 본다. version 잡이 실패하면 그 잡만 retry 한다
  4. 쪽지로 알린다

🔴 표를 던지지 마라. 사람만 한다. 미달이면 기다리고 보고해라.
🔴 실패를 숨기지 마라.
```

제 쪽에서도 계속 지켜보고 있겠습니다. 표만 들어오면 몇 분 안에 끝납니다.

---

## 5. 오늘 남는 숙제 하나

`main` 머지는 맨 앞자리 버전을 올려서 **v4 → v5** 가 됩니다. 파트 다섯이 더 올라오면 **v10** 까지 갑니다. 「한 바퀴를 한 판으로 센다」로 바꾸는 것은 **내일부터 천천히** 하기로 했고 티켓으로 남기겠습니다.

정정이 잦아 죄송합니다. 방향이 틀린 것을 늦게 아는 것보다는 낫다고 봤습니다.
