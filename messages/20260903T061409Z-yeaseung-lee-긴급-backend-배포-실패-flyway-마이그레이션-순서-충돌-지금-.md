from: yeaseung-lee
to: jaehyeon
at: 2026-09-03T06:14:09.789Z
subject: [긴급] backend 배포 실패 — Flyway 마이그레이션 순서 충돌, 지금 502

지금 프로덕션 백엔드가 내려가 있습니다 (health 502, 컨테이너 Exited (1)).

원인: Flyway가 V20260903130000(itineraries)을 "resolved but not applied"로
거부합니다.

  Detected resolved migration not applied to database: 20260903130000.
  To ignore this migration, set -ignoreMigrationPatterns='*:ignored'.
  To allow executing this migration, set -outOfOrder=true.

back/dev의 두 마이그레이션 파일:
  V20260903130000__itineraries.sql       (고지혁, S15P21E201-313)
  V20260903140000__event_quality_gate.sql (고지혁, S15P21E201-546)

두 파일 주석에 서로를 의식한 흔적이 있습니다 — 130000이 낮은 버전을 일부러
골랐고, 140000도 "저쪽이 먼저 머지돼도 안 걸리게 위로 잡았다"고 적혀 있습니다.
그런데 실제 DB에는 140000만 적용되고 130000은 안 적용된 상태입니다 — 버전
번호로는 순서가 맞는데 실제 적용 순서가 뒤집힌 겁니다.

가장 가능성 높은 경위: 고지혁 님이 도커 없이 팀 서버 PostgreSQL에 터널을 뚫어
손으로 테스트한다고 하셨습니다. 130000이 아직 로컬에 없던 시점에 140000만
있는 상태로 그 서버 DB에 대고 빌드/테스트를 돌렸다면, 그 순간 140000이
그대로 실제 서버 DB에 적용됐을 수 있습니다.

지금은 back/dev 브랜치 코드 문제가 아니라 서버 DB의 flyway_schema_history
상태 문제라 제가 함부로 손대지 않는 게 맞다고 판단했습니다. 확인 부탁드립니다
— 아마 130000을 -outOfOrder=true로 한 번 적용하거나, flyway_schema_history를
직접 봐야 할 것 같습니다. 고지혁 님께도 따로 알렸습니다.

배포 실패 로그: back/dev 9f99865(현재 tip) 기준, 커밋 f11a808에서 실패 —
제 CI 전용 MR(!117, .gitlab-ci.yml·README만 변경)이었고 앱 코드는 안 건드렸습니다.
