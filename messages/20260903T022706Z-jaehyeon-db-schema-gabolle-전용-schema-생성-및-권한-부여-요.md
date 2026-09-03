from: jaehyeon
to: yeaseung-lee
at: 2026-09-03T02:27:06.150Z
subject: [DB schema] gabolle 전용 schema 생성 및 권한 부여 요청

백엔드 전용 schema 분리 방향으로 BE 설정 작업을 완료했습니다.

변경 내용(현재 로컬 브랜치):
- application-dev.properties에서 Flyway/JPA 기본 schema를 GABOLLE_DB_SCHEMA(기본값 gabolle)로 지정
- spring.flyway.create-schemas=false로 운영 schema를 사전 생성하도록 명시
- 로컬 docker-compose는 새 PostgreSQL 볼륨 초기화 시 gabolle schema를 자동 생성
- 전체 Gradle 테스트 통과

운영 app_db는 기존 볼륨이라 Compose init 스크립트가 실행되지 않으므로, DB에서 아래 작업을 부탁드립니다.

CREATE SCHEMA IF NOT EXISTS gabolle AUTHORIZATION app_user;
GRANT USAGE, CREATE ON SCHEMA gabolle TO app_user;

그리고 Jenkins 배포 전 app_user가 gabolle schema에서 테이블·Flyway 이력 테이블을 만들 수 있는지 확인해주세요. 실제 비밀번호는 공유하지 않아도 됩니다.

schema가 준비되면 제 설정 변경을 별도 MR로 올리고, 그 다음 back/dev 재배포 후 Flyway와 가입 API를 확인하겠습니다.
