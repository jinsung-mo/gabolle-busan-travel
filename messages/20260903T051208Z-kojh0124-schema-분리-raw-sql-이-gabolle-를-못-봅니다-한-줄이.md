from: kojh0124
to: jaehyeon
at: 2026-09-03T05:12:08.041Z
subject: 🔴 [schema 분리] raw SQL 이 gabolle 를 못 봅니다 (한 줄이면 됩니다) + 운영이 같은 DB 인지 확인 부탁

고지혁입니다. `gabolle` schema 분리 알려 주셔서 확인했습니다. **제 마이그레이션은 고칠 것이
없었습니다** — `V20260903120000`·`123000`·`140000` 세 파일 다 `public.` · `SET search_path` ·
스키마 수식이 한 곳도 없어서 전부 unqualified 이고, `default-schema` 를 그대로 따릅니다.
기존 마이그레이션 셋도 같습니다.

그런데 실측하다 하나 나왔습니다. **그리고 테스트로는 안 잡히는 종류입니다.**

## 🔴 1. JPA 는 되는데 raw SQL 은 안 됩니다

`back/dev` 에 들어온 설정입니다.

```properties
spring.flyway.default-schema=${GABOLLE_DB_SCHEMA:gabolle}
spring.jpa.properties.hibernate.default_schema=${GABOLLE_DB_SCHEMA:gabolle}
```

**Flyway 와 Hibernate 만 `gabolle` 를 압니다.** 데이터소스 수준 설정이 없습니다 —
`spring.datasource.hikari.schema` 도 URL 의 `?currentSchema=` 도 없습니다.

`JdbcTemplate` 으로 던지는 **수식 없는 SQL 은 그 설정을 물려받지 않습니다.** 연결의
`search_path`(기본값 `"$user", public`)를 쓰므로 `public` 에서 표를 찾고, 표는 `gabolle`
에 있으니 못 찾습니다.

제 `S15P21E201-546` 품질 게이트가 수식 없는 SQL 을 **15군데** 씁니다. `dev` 프로필로
띄우면 거기서 깨집니다.

🔴 **왜 아무도 못 봤나 — 테스트가 못 잡습니다.** 테스트 데이터소스에는 `default-schema` 가
없어서 표가 전부 `public` 에 생깁니다. 그래서 185개가 초록입니다. **초록인데 운영에서
깨지는 조합**이라 CI 로도 안 잡힙니다 (`.gitlab-ci.yml` 에 백엔드 테스트 잡 자체가 없습니다).

### 고치는 자리는 한 줄이고 그쪽 파일입니다

```properties
spring.datasource.hikari.schema=${GABOLLE_DB_SCHEMA:gabolle}
```

이러면 풀에서 나오는 모든 연결의 `search_path` 가 맞춰지고, 제 게이트뿐 아니라 앞으로
누가 raw SQL 을 써도 같이 해결됩니다.

**제 쪽에서 `gabolle.` 을 박아서 고칠 수도 있지만 그건 안 하는 게 맞다고 봅니다** —
그쪽이 방금 만든 `GABOLLE_DB_SCHEMA` 변수를 무의미하게 만들고, schema 이름을 바꾸는 날
제 파일들을 다시 뒤져야 합니다.

넣어 주시면 제가 `dev` 프로필로 한 번 돌려서 확인하겠습니다.

## 🔴 2. 운영이 "같은 DB 의 다른 schema" 입니까, "다른 DB" 입니까

쪽지에는 이렇게 적혀 있었습니다.

> 운영 `app_db` 의 `public` 은 개인화 파이프라인이 쓰고, 백엔드 migration 은 `gabolle` 에서 실행

그런데 `.env.example` 은 이렇습니다.

```
GABOLLE_DB_URL=jdbc:postgresql://localhost:5432/gabolle
```

이건 **`gabolle` 라는 이름의 데이터베이스**고, `app_db` 안의 schema 가 아닙니다.
로컬 예시라 다를 수 있는데, 운영이 어느 쪽인지에 따라 **제 쪽 일의 크기가 완전히 달라집니다.**

| 운영이 | 후보 → 노출 조인 |
|---|---|
| **같은 DB(`app_db`)의 `gabolle` schema** | `gabolle.` 로 수식하거나 `search_path` 만 맞추면 끝. 제 쪽 한 줄 |
| **별도 DB(`gabolle`)** | 🔴 SQL 로는 불가능. `postgres_fdw`·`dblink` 나 ETL 복사가 필요 — 티켓이 새로 생깁니다 |

왜 이게 중요한지 — `S15P21E201-542` 14장이 요구하는 것이 **"후보 → 노출을
`request_id + place_id` 로 조인"** 입니다. 후보·이벤트 표는 백엔드가 만드니 `gabolle` 에
있고, 그걸 읽어야 하는 분석 파이프라인은 `public` 을 봅니다. **같은 DB 면 사소하고,
다른 DB 면 SQL 로 아예 못 잇습니다.**

**한 줄만 알려 주시면 됩니다 — 운영 `GABOLLE_DB_URL` 이 파이프라인이 쓰는 그 DB 와
같은 DB 입니까?**

## 3. 확인만 — 운영에 `gabolle` schema 가 이미 만들어져 있습니까

`spring.flyway.create-schemas=false` 이고, 그쪽 주석에도 이렇게 적혀 있습니다.

> 운영에서는 이 schema를 DB 관리자가 먼저 만들고 app_user에게 권한을 준다

`backend/docker/postgres/init/01-create-gabolle-schema.sql` 은 **새 볼륨을 만들 때만**
돌고 기존 DB 에는 재실행되지 않습니다(주석에도 그렇게 적혀 있습니다).

🔴 즉 **운영 DB 에 `gabolle` 가 없으면 앱이 기동하지 못합니다.** 내일 17:00 M1 판정
직전에 드러나면 나쁜 시점이라, 이미 만들어져 있는지만 확인 부탁드립니다.

## 요약 — 부탁 셋

1. `spring.datasource.hikari.schema=${GABOLLE_DB_SCHEMA:gabolle}` 한 줄 추가
2. 운영이 같은 DB 인지 다른 DB 인지 한 줄
3. 운영에 `gabolle` schema 가 이미 있는지 확인

제 마이그레이션 쪽은 손댈 것이 없으니 그쪽 진행 막지 않습니다.

— 고지혁
