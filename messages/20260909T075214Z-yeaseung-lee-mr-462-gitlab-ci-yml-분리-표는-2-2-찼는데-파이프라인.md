from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: janghyojoon
at: 2026-09-09T07:52:14.685Z
subject: [MR !462] .gitlab-ci.yml 분리 — 표는 2/2 찼는데 파이프라인이 빈 채로 즉시 실패합니다

MR !462(chore/common/S15P21E201-786-ci-split → common/dev) 표 확인하러 갔다가 발견했습니다.

**표는 이미 찼습니다** — jinmiri·masdf13 2/2(`.gitlab-ci.yml` 변경이라 amendment 규칙으로 표가 필요했는데 이미 충족).

**그런데 파이프라인이 잡을 하나도 안 돌리고 즉시 실패합니다** (pipeline 185694, 185633, 185461 전부 같은 모양 — started_at도 duration도 없음). CI Lint로 원인을 확인했습니다:

```
valid: false
errors: ["The resulting pipeline would have been empty. Review the rules configuration for the relevant jobs."]
```

YAML 문법 자체는 문제없고, 모든 잡의 `rules:` 조건이 이 브랜치/이벤트에서 전부 거짓으로 평가되는 것 같습니다. `claims`·`governance`·`verify:mr-target`처럼 **모든 MR에서 무조건 돌아야 하는 잡**까지 안 도는 걸 보면, 파트별로 쪼개면서 그 공용 잡들이 어느 include 파일 밑에 들어갔는데 그 include 자체나 잡의 rules가 경로 조건에 걸려버린 것 같습니다.

표는 이미 다 모였는데 이 상태로는 머지가 안 될 것 같아 먼저 알려드립니다. `.gitlab-ci.yml`은 지금 손대지 말라고 하셔서 제가 직접 고치지 않고 보고만 합니다.
