from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: all
at: 2026-09-18T17:49:53.314Z
subject: 🟡 판 번호 태그가 두 파트 머지에서 부딪힙니다 — back/dev 가 v24.0.57 을 front/dev 에 뺏겼습니다 (axMap 쪽)

밤샘 점검으로 머지를 몰아서 하다 보니 드러났습니다. **머지를 막지는 않습니다** — 기록만 남겨 둡니다.

## 무슨 일이

`front/dev` 와 `back/dev` 에 **몇 분 안에 머지가 겹치면** 두 파이프라인이 같은 다음 번호를 계산하고, 뒤에 push 하는 쪽이 거부됩니다.

```
브랜치 back/dev  →  patch (dev 작업)
  v24.0.56  →  v24.0.57
  태그 생성: v24.0.57
태그 push 실패 (origin)
remote: error: cannot lock ref 'refs/tags/v24.0.57': reference already exists
 ! [remote rejected]  v24.0.57 -> v24.0.57 (reference already exists)
```

확인해 보니 **`v24.0.57` 은 `front/dev` 머지가 가져갔습니다.**

```
v24.0.57  →  634ecef6  Merge 'docs/front/S15P21E201-1318-decided-deviations' into 'front/dev'
back/dev  →  a1b1c860  Merge 'fix/back/S15P21E201-1315-real-menu-columns' into 'back/dev'
```

즉 **파트가 달라도 번호 줄이 하나**라, 두 파트가 동시에 머지되면 반드시 한쪽이 집니다.

## 영향

- 🟢 **머지는 안 막힙니다.** `version` 잡 주석대로 post-merge 라 리뷰·머지에 영향이 없습니다
- 🔴 다만 **그 커밋은 태그를 못 받습니다.** 진 쪽 브랜치의 그 머지는 판 번호가 비어 버립니다
- 🔴 그리고 `back/dev` 파이프라인이 **빨갛게 남습니다** — 다음 사람이 「코드가 깨졌나」로 읽습니다. 실제로는 이 파이프라인에 시험 잡이 아예 없고(`jira`·`version`·`claims` 셋뿐), 코드는 멀쩡합니다

## 어디서 고칠 것인가

`.gitlab-ci.yml` 의 `version` 잡은 `npx axmap-cli version bump --branch ... --push` 한 줄만 부릅니다. 번호를 정하고 push 하는 것은 **axMap 안**이라 이 저장소에서 고칠 것이 아닙니다 (CONTRIBUTING 0.3 — axMap 은 `https://lab.ssafy.com/rleaderjoon/axmap`).

제안은 하나입니다 — **push 가 「이미 있다」로 거부되면 태그를 다시 받아 번호를 새로 계산해 한두 번 더 시도**하면 됩니다. git push 가 원래 이런 경쟁을 그렇게 다룹니다(CAS — 내가 읽은 뒤로 바뀐 게 없을 때만 쓴다).

제가 axMap 저장소를 건드리지 않는 것이 맞다고 봐서 여기까지만 적습니다. 필요하시면 티켓을 내겠습니다.

## 오늘 밤 계획

사용자 지시로 **2시간 간격 3회차**로 빌드→테스트→티켓→고침→머지를 돌립니다. 머지가 몰릴 것이라 이 충돌이 **몇 번 더 날 수 있습니다.** `back/dev`·`front/dev` 가 이 잡 때문에 빨간 것은 **코드 문제가 아닙니다** — 파이프라인의 잡 목록을 보시면 바로 갈립니다.

— 이예승
