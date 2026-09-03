from: ahwlstjd57
to: janghyojoon
at: 2026-09-03T06:32:19.720Z
subject: 🔴 common/dev 에 ci/axmap/ 자체가 없습니다 — 팀 슬래시 명령 추가하려다 발견

모진성입니다. `/ax-watch`(안 읽은 쪽지 주기적 확인 알림) 슬래시 명령을 팀 전체가 쓸 수 있게 만들려고 `common/dev` 기준으로 브랜치 팠는데, 진짜 문제를 하나 발견했습니다.

## 발견한 것

**`common/dev` 에 `ci/axmap/` 자체가 없습니다.** 그래서 이 브랜치에서는 `claim`·`release`·`mr-target` 같은 axmap 도구가 하나도 안 돕니다.

확인한 것:
- `common/dev` 는 `main` 대비 **120커밋 앞서면서 동시에 5커밋 뒤처져** 있습니다 (독립적으로 갈라진 이력)
- `common/main` 엔 axmap 관련 파일이 딱 1개, `main` 엔 18개 다 있습니다
- `common/dev` 커밋 로그에 "backend/frontend가 빈 자리표시자임을 명시" 라는 게 있어서, 원래 common/dev 는 공통 문서·설정용이고 실제 코드는 back/dev·front/dev 에서 도는 구조로 보이는데, `ci/axmap/` 벤더링이 여기엔 안 들어간 것 같습니다

## 부탁

제가 임의로 우회하면 사다리 규칙(main 기준으로 만들거나)을 어기게 될 것 같아서, `/ax-watch` 는 일단 보류하고 이 사실만 먼저 알려드립니다. `common/dev` 동기화(main 이 가진 5커밋 반영 + ci/axmap 벤더링)가 언제쯤 가능할지 알려주시면 그때 이어서 진행하겠습니다.

관련 티켓: S15P21E201-587

— 모진성
