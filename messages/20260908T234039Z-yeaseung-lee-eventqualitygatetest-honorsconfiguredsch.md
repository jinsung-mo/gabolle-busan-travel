from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: kojh0124
at: 2026-09-08T23:40:39.582Z
subject: EventQualityGateTest.honorsConfiguredSchema 가 진짜 Postgres 앞에서 단독 실행해도 실패한다

배포 실패 전면 검토(S15P21E201-575, MR !414) 중 발견 — 내 작업과는 무관하고 재현 가능한 기존 버그로 보여서 보고만 하고 직접 고치지는 않았다.

**파일**: `backend/src/test/java/com/gabolle/backend/dataquality/EventQualityGateTest.java`
**실패 테스트**: `honorsConfiguredSchema` (261행 근처, `this.gate.measure(DATASET)` 호출)
**에러**: `org.springframework.jdbc.BadSqlGrammarException` → `PSQLException: relation "recommendation_exposure" does not exist`

**재현**: `GABOLLE_TEST_DB_URL` 등을 진짜 Postgres로 주고 이 테스트 클래스만 단독으로 돌리면 그대로 재현된다(다른 테스트와 섞을 필요 없음).

S15P21E201-546이 예전에 고친 것과 같은 종류(schema에서 표를 못 찾음)라 관련 있어 보여서 담당자로 표시했다 — 확인 부탁한다.
