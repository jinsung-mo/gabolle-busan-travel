from: janghyojoon
fromEmail: rleaderjoon@gmail.com
to: yeaseung-lee
at: 2026-09-07T10:32:01.060Z
subject: [S15P21E201-703] backend:migration-order 잡의 git 없음(exit 127) 고쳐서 MR !324 올렸습니다

703 이 아직 진행 중이라 겹칠까 봐 먼저 알립니다. **이미 고쳐 두셨다면 !324 를 닫아 주세요.**

## 무엇이 문제였나

`backend:migration-order` 가 **처음부터 한 번도 통과한 적이 없습니다.** 종료 코드
127 — "그런 명령이 없다".

```
/bin/sh: eval: line 196: git: not found
$ git fetch origin "$CI_MERGE_REQUEST_TARGET_BRANCH_NAME" --quiet
ERROR: Job failed: exit code 127
```

원인은 잡 정의 한 줄입니다. 이 저장소는 모든 잡을 `node:20-alpine` 에서 돌리는데
**거기에 git 이 없어서** 전역 `before_script`(잡마다 본 작업 전에 도는 준비 단계)가
매번 `apk add --no-cache git bash` 로 깔아 줍니다. 그런데 이 잡이 그 준비 단계를
`before_script: []` 로 덮어써서 **설치를 지워 놓고** 바로 아래에서 git 을 부릅니다.

## 왜 그렇게 됐는지 짐작이 갑니다

같은 파일의 `mr:gates` 와 `verify:mr-target` 도 똑같이 `[]` 를 쓰고, 거기엔
*"이 잡은 제일 싸다 — 컨테이너 띄우고 node 한 번 부르는 게 전부라 apk 설치도
건너뛴다"* 는 주석까지 있습니다. **그 둘은 맞습니다** — node 만 부르니까요.
이 잡은 git 을 쓴다는 것이 다릅니다.

## 고친 것

지운 것을 되살리고, 다음 사람이 같은 것을 다시 지우지 않게 **왜 여기서는 건너뛰면
안 되는지**를 그 자리에 주석으로 적었습니다. 잡이 몇 초 느려지는 대신 돕니다.

## 왜 지금 급한가

이 잡은 `allow_failure`(빨개져도 파이프라인 전체는 안 빨개진다는 표시)가 없어서
**머지를 막습니다.** `back/dev` → `back/main` 승격이 지금 이것 때문에 안 열립니다.

## 곁들여 — 승격 표 이야기

교착은 axmap 1.2.0 으로 이미 풀렸습니다. 최신판으로 다시 재니 이렇습니다.

| | 표 |
|---|---|
| `front/dev` → `front/main` | **1/2** — 예승님 표가 살아 있습니다. 한 표만 더 |
| `back/dev` → `back/main` | **0/2** — 두 장 다 헤드가 바뀌어 죽었습니다 |

**이제 저자도 표를 던질 수 있습니다.** 던질 수 있는 사람이 정족수보다 적으면
자기 표 배제를 그 판정에 한해 풉니다. 다만 **브랜치가 움직이면 표가 또 죽으니**,
표를 모으는 동안은 그 브랜치에 머지를 멈추는 게 먼저입니다.
