from: kojh0124
to: ahwlstjd57
at: 2026-09-03T05:10:17.208Z
subject: [결과] itineraries DDL 돌렸습니다 — 185개 통과, SQL 은 문제없습니다. 다만 리베이스가 먼저입니다

고지혁입니다. 부탁하신 것 돌렸습니다. **SQL 자체는 문제없습니다.**

## 결과

```
총 185  건너뜀 0  실패 0  오류 0
```

초록만 믿지 않으려고 표가 실제로 생겼는지도 확인했습니다.

```
Flyway 이력   7개 전부 success = t
             20260902.1 · 20260902.2 · 20260902090000
             20260903120000 · 20260903123000 · 20260903130000 · 20260903140000
표            trip · itineraries · itinerary_versions ·
             preference_answer · constraint_answer · event_quality_report
뷰            recommendation_exposure
외래키        fk_itinerary_trip  ← trip(trip_id) 참조가 실제로 걸렸습니다
```

## 🔴 다만 그 브랜치를 그대로 돌리면 실패합니다 — 리베이스가 먼저입니다

`feat/back/S15P21E201-313-itinerary-ddl` 은 **`back/dev` 보다 19커밋 뒤처져 있고**,
제 `V20260903120000`(trip 표를 만드는 파일)이 그 브랜치에 없습니다.

그 브랜치의 마이그레이션 목록입니다.

```
V20260902_1 · V20260902_2 · V20260902090000 · V20260903130000
                                              ↑ itineraries
```

`itineraries` 가 `trip(trip_id)` 를 참조하는데 **`trip` 표를 만드는 파일이 없으니**,
저 상태로 Flyway 를 돌리면 외래키에서 멈춥니다.

그래서 제가 돌린 것은 **`back/dev` 에 그 브랜치를 머지한 상태**입니다 — 머지되면 실제로
일어날 일과 같게 맞췄습니다. 그 상태에서 7개가 순서대로 다 적용됐습니다.

**`back/dev` 로 리베이스만 하시면 그대로 갑니다.** 버전 번호는 손대실 필요 없습니다 —
`V20260903130000` 이 제 `120000`·`123000` 뒤, `140000`(-546 품질 게이트) 앞이라 순서가
맞습니다.

## 답 감사합니다

`trip.status` · `answerStatus`·`scope` 완전한 수정 · 회귀 둘 이어서 하신다는 것 —
전부 확인했습니다. **`answerStatus` 를 매핑 전에 넣어 주신 게 컸습니다.** 그 구분은
나중에 재구성할 방법이 없는 종류라, 지금 들어간 것이 이번 주 데이터의 질을 갈랐습니다.

## 🔴 그리고 새로 하나 — schema 분리가 raw SQL 을 깨뜨립니다

박재현 님의 `gabolle` schema 분리가 `back/dev` 에 들어왔습니다.

```properties
spring.flyway.default-schema=${GABOLLE_DB_SCHEMA:gabolle}
spring.jpa.properties.hibernate.default_schema=${GABOLLE_DB_SCHEMA:gabolle}
```

🔴 **데이터소스 수준 설정이 없습니다.** Flyway 와 Hibernate 만 `gabolle` 를 압니다.
`JdbcTemplate` 로 던지는 수식 없는 SQL 은 그 설정을 물려받지 않고 연결의 `search_path`
(`"$user", public`)를 씁니다. 즉 **JPA 는 되는데 raw SQL 은 `public` 을 보고 표를 못 찾습니다.**

제 `EventQualityGate` 가 수식 없는 SQL 을 15군데 씁니다. `dev` 프로필로 띄우면 거기서
깨집니다. **테스트로는 안 잡힙니다** — 테스트 데이터소스에는 default-schema 가 없어서
전부 `public` 에 생기고, 그래서 185개가 초록입니다.

고칠 자리는 한 줄이고 박재현 님 파일입니다.

```properties
spring.datasource.hikari.schema=${GABOLLE_DB_SCHEMA:gabolle}
```

그쪽에도 알리겠습니다. 그쪽 코드는 JPA 라 지금은 안 걸리지만, `event` 회귀 고치실 때
raw SQL 을 쓰시면 같은 데 걸립니다.

— 고지혁
