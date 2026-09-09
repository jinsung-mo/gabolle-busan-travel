from: kojh0124
fromEmail: kojh0124@gmail.com
to: yeaseung-lee
at: 2026-09-09T01:00:19.337Z
subject: EventQualityGateTest 278행 — 플레이키 아닙니다, 원인은 !414 자신입니다. 고쳤습니다 (MR !425)

보고 감사합니다. 재현하고 고쳤습니다 — **MR !425**, back/dev 대상. 이거 머지되면 !414 초록입니다.

## 정정 — 플레이키가 아닙니다

HikariCP 커넥션 바인딩·트랜잭션 동기화 타이밍 쪽은 아닙니다. 그쪽을 계속 파시면 아무것도 안 나옵니다. **순서에 따라 갈릴 뿐 결정론적**입니다.

`SET LOCAL` 도 정상 동작하고 있었습니다. 문제는 그게 **무엇을 버리는가** 입니다.

## 원인 — 방아쇠가 !414 입니다

!414 가 더한 `DevProfileApplicationContextTest` 의 `@BeforeAll` 이 이걸 합니다.

```java
statement.execute("CREATE SCHEMA IF NOT EXISTS gabolle");
```

만들고 **안 지웁니다.** 그 한 줄이 뒤에 도는 모든 컨텍스트의 기본 search_path 의미를 바꿉니다.

1. CI 는 사용자 `gabolle` 로 붙고, 기본 search_path 는 `"$user", public` 입니다
2. `gabolle` schema 가 생기는 순간 `$user` 가 **그 schema 로 풀립니다**
3. 그래서 Flyway 가 표 50개를 `public` 이 아니라 `gabolle` 에 만듭니다
4. 265행은 그대로 통과합니다 — 기본 경로가 `gabolle` 을 보니까요
5. 278행이 `SET LOCAL search_path TO "probe", public` 을 겁니다. 이게 **`$user` 항목을 버립니다.** `recommendation_exposure` 는 `gabolle` 에 있고 `public` 엔 없습니다 → `relation does not exist`

dev 프로필 테스트가 먼저 도는 실행에서만 깨져서 플레이키로 보인 겁니다. 로컬에서 이 클래스만 단독으로 돌리시면 `gabolle` schema 가 안 생기니 14/14 통과합니다 — 저도 그것까지 똑같이 재현했습니다.

## 진짜 결함은 테스트 쪽이었습니다

`EventQualityGate` 는 안 고쳤습니다. 운영에서는 `defaultSchema` 가 표가 실제로 있는 schema 라 게이트 동작이 옳습니다.

잘못된 건 테스트입니다. probe schema 에 `event_outbox` **하나만** 만들어 놓고 게이트를 거기로 스코프했는데, 게이트는 `recommendation_exposure`·`recommendation_candidate`·`event_quality_report` 도 함께 읽습니다. 그 셋은 폴백 `public` 으로만 풀렸습니다 — **"나머지 표가 전부 public 에 있다"** 는, 어디에도 안 적힌 전제 위에 서 있던 테스트였습니다.

고친 방법: probe 를 진짜 마이그레이션으로 통째로 만들어 **비어 있지만 완전한** schema 로 둡니다. 폴백에 안 기대므로 표가 어느 schema 에 있든 결과가 같습니다.

## 실측 (CI 와 같은 구성 — PostgreSQL 16, 사용자 gabolle, DB gabolle_test)

| | |
|---|---|
| 깨끗한 DB, 이 클래스 단독 | 14/14 통과 (이예승 님 로컬 결과와 같음) |
| gabolle schema 있음, 고치기 전 | 278행 실패, 보고하신 예외와 동일 |
| **!414 브랜치, 두 클래스 함께, 고치기 전** | **278행 실패 — CI 재현** |
| **!414 브랜치, 두 클래스 함께, 고친 뒤** | **14/14 + 1/1 통과** |

## 🔴 남은 것 둘 — !425 밖입니다

**1. `docs/DB-STANDARD.md` 가 이제 거짓말을 합니다.** 거기 이렇게 적혀 있습니다 — *"테스트 데이터소스에는 default_schema 가 없어서 표가 전부 public 에 생기고 초록이 뜬다."* dev 프로필 테스트가 돈 뒤로는 `gabolle` 에 생깁니다. 이번에 하루 날린 게 정확히 그 문장의 전제입니다. 다음 사람도 같은 데서 넘어집니다.

**2. `CREATE SCHEMA IF NOT EXISTS gabolle` 를 안 지우는 것 자체가 지뢰입니다.** 지금 걸린 건 이 테스트 하나뿐입니다 — 다른 테스트들은 `table_schema = current_schema()` 로 스코프해 둬서 무사합니다(2026-09-07 에 누가 이미 겪고 막아 뒀더군요). 다만 앞으로 search_path 를 손대는 코드가 하나라도 더 생기면 같은 방식으로 깨집니다. `@AfterAll` 에서 지우실지, 아니면 "시험용 DB 에 gabolle schema 가 있는 것이 정상 상태" 로 못 박으실지는 !414 쪽 판단이라 제가 안 건드렸습니다.

필요하시면 재현 절차 그대로 드리겠습니다.
