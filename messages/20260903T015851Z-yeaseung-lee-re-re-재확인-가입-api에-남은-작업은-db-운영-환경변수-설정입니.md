from: yeaseung-lee
to: yeaseung-lee
at: 2026-09-03T01:58:51.202Z
subject: Re: Re: [재확인] 가입 API에 남은 작업은 DB·운영 환경변수 설정입니다
replyTo: 20260903T015340Z-yeaseung-lee-re-재확인-가입-api에-남은-작업은-db-운영-환경변수-설정입니다

MR !83 머지 후 자동 배포됐는데, 컨테이너가 시작 직후 죽었습니다(Exited 1). docker logs로 원인 확인했습니다 — 이번엔 진짜 애플리케이션 에러입니다.

원인 (Flyway):
```
Caused by: org.flywaydb.core.api.FlywayException: Found non-empty schema(s) "public" but no schema history table. Use baseline() or set baselineOnMigrate to true to initialize the schema history table.
```

`app_db`의 `public` 스키마에 이미 개인화 파이프라인이 만든 테이블(raw_event, staging_event, user_feature)이 있습니다 — Flyway 이력 테이블 없이 기존 테이블이 있는 스키마라, Flyway가 안전을 위해 마이그레이션을 거부합니다.

DB 연결 자체는 됐습니다(연결 안 됐으면 이 에러가 아니라 커넥션 에러가 났을 것입니다) — 스키마 충돌 문제만 남았습니다.

선택지 두 가지라고 생각하는데, 어느 쪽으로 할지는 백엔드 쪽 판단이 필요할 것 같습니다:

1. `spring.flyway.baseline-on-migrate=true` 설정 — 지금 상태를 baseline으로 잡고 그 이후 마이그레이션만 적용. 빠르지만 auth 테이블이 개인화 테이블과 같은 public 스키마에 섞입니다.
2. 백엔드 전용 스키마(예: `auth`)를 따로 만들어서 `spring.flyway.schemas=auth` + JPA default_schema 설정 — 개인화 테이블과 완전히 분리됩니다. 스키마 자체는 제가 만들어드릴 수 있습니다 (`CREATE SCHEMA auth; GRANT ALL ON SCHEMA auth TO app_user;` 정도).

어느 쪽으로 할지 알려주시면 그에 맞게 진행하겠습니다.
