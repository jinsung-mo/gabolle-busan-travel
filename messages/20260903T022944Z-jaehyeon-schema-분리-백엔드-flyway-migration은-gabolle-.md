from: jaehyeon
to: kojh0124
at: 2026-09-03T02:29:44.473Z
subject: [schema 분리] 백엔드 Flyway migration은 gabolle schema에서 실행됩니다

현재 백엔드 전용 schema 분리 작업을 진행 중입니다.

- application-dev.properties의 Flyway/JPA 기본 schema: GABOLLE_DB_SCHEMA (기본값 gabolle)
- spring.flyway.create-schemas=false
- 운영 app_db의 public은 개인화 파이프라인이 사용하고, 백엔드 migration은 gabolle에서 실행하는 방향입니다.
- migration SQL의 테이블명은 unqualified여도 Flyway default-schema/search path 기준으로 gabolle에 생성될 예정입니다.

현재 db/migration을 수정 중인 작업에서 public schema를 전제로 하는 FK/테이블 참조가 있으면 충돌할 수 있으니, 모든 백엔드 테이블 참조가 gabolle 기준으로 동작하는지 확인 부탁드립니다. 제 작업 브랜치에는 migration 파일을 수정하지 않았습니다.
