from: janghyojoon
fromEmail: rleaderjoon@gmail.com
to: jinmiri
at: 2026-09-09T08:23:36.756Z
subject: 🔴 [front 는 제가 풉니다] 지금 front/main · front/dev 를 만지지 말아 주세요 — 끝나면 MR 올리겠습니다

🔴 **`front` 는 제가 풀겠습니다. 지금 `front/main` · `front/dev` 를 만지지 말아 주세요** — 동시에 하면 서로 거부당합니다.

끝나면 MR 을 올리고 다시 쪽지 드리겠습니다. **진미리 님은 MR 만 보시면 됩니다.**

## 1. 왜 제가 하나

다른 다섯 파트는 다 끝났고 `front` 만 남았습니다. 그리고 방금 **CI 검사를 파트별 파일로 가르는 것**이 `main` 에 들어가면서, 가장 위험했던 자리가 쉬워졌습니다. 그 방법을 제가 만들었으니 제가 하는 게 맞습니다.

## 2. 무엇을 할 건가 — 열 개 중 아홉은 기계적입니다

```
CLAUDE.md · docs/CI.md · docs/HANDOVER.md · docs/ONBOARDING.md
setup.sh · setup.ps1 · .claude/commands/ax-vote.md · ax-ballot.md   → main 쪽 받기
frontend/README.md                                                  → front 쪽 남기기
.gitlab-ci.yml                                                      → 아래 3절
```

🔴 **`CLAUDE.md` 가 16줄로 줄어드는 것에 놀라지 마세요.** 규칙이 사라지는 게 아닙니다 — 8월 31일에 팀 규칙을 `CONTRIBUTING.md`(394줄)로 옮기고 `CLAUDE.md` 는 이정표만 남기기로 정했습니다(S15P21E201-508). 제가 대조해서 확인했습니다.

## 3. `.gitlab-ci.yml` — 여기가 진짜 문제였고, 답이 생겼습니다

`front/main` 의 파일은 **8월 판에서 멈춰 있습니다.** 두 파일이 서로 없는 것을 갖고 있습니다.

| | front 에만 있는 것 | main 에만 있는 것 |
|---|---|---|
| 파트 잡 | **`frontend:smoke` · `frontend:dependency-scan`** | `backend:*` 셋 · `verify:bigdata` |
| 그 밖에 | **`workflow:`** (새 커밋이 오면 앞 파이프라인을 취소) | `claims:checkpoint` · `jira` · `vote:recheck` · `status:publish` · `include:` |

**어느 쪽을 골라도 뭔가 사라집니다.** 그래서 원래 손으로 합쳐야 했고, 그게 오늘 가장 위험한 자리였습니다.

이렇게 합니다.

```
① .gitlab-ci.yml  → main 쪽을 통째로 받는다
② frontend:smoke · frontend:dependency-scan → ci/parts/frontend.yml 로 옮긴다
③ workflow: 세 줄 → main 파일 맨 위에 더한다
```

**②가 오늘 CI 를 가른 이유 그 자체입니다.** 옮기고 나면 `front` 는 앞으로 이 파일에서 영영 안 부딪힙니다.

🔴 **잘라 붙이기라 내용이 한 글자도 안 바뀝니다.** MR 설명에 이걸 숫자로 보여 드리겠습니다.

```bash
grep -c "^frontend:" ci/parts/frontend.yml   # 2
grep -c "^workflow:" .gitlab-ci.yml          # 1
```

`frontend:smoke` 안의 주석(캐시가 줄여 주는 것이 10~20초라는 실측, 타입 검사를 왜 여기 넣었는지)도 **그대로 옮깁니다.** 그건 값을 주고 알아낸 기록입니다.

## 4. 확인해 주실 것 하나

MR 이 올라오면 **`frontend:smoke` 와 `frontend:dependency-scan` 이 실제로 도는지**만 봐 주세요. 파이프라인 화면에 잡 이름이 보이면 됩니다.

**하나라도 안 보이면 머지하지 말고 알려 주세요.** `bigData` 에서 실제로 한 줄이 사라질 뻔했습니다 — LFS 훅 우회 한 줄이었는데, 잘못 받았으면 태그 push 가 죽었을 겁니다.

## 5. 지금 상태

```
🟢 main 과 같음   back · bigData · map · ai · common
🔴 남음          front  (327커밋 · 충돌 10)
```

`front` 만 들어가면 **오늘 사다리가 완전히 한 바퀴** 돕니다.
