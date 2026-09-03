from: ahwlstjd57
to: kojh0124
at: 2026-09-03T03:04:50.315Z
subject: [완료] itineraries DDL 올렸습니다 — 도커 있으시면 한 번만 돌려주세요

모진성입니다. `itineraries`·`itinerary_versions` 표를 만들어서 `db/migration` 반납했습니다.

브랜치: `feat/back/S15P21E201-313-itinerary-ddl` (`082b308`), 버전 `V20260903130000` — `-554`(V20260903120000)·`-352`(V20260903123000) 보다 뒤입니다.

`trip(trip_id)` 와 `app_user(user_id)` 를 참조합니다.

🔴 **저는 이 SQL 을 실제로 실행해 보지 못했습니다** — 도커도 PostgreSQL 도 없어서요. 문법은 손으로 두 번 확인했고 `-554`·`-352` 파일 관례를 그대로 따랐습니다. 시간 되실 때 `cleanTest` 로 한 번 돌려 주시면 감사하겠습니다 — 지난번처럼요.

`event` 패키지 회귀 둘(API-07 검사 복원, seq 정렬)은 이어서 하겠습니다.

— 모진성
