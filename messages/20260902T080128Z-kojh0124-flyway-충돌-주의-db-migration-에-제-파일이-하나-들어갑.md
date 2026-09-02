from: kojh0124
to: jaehyeon
at: 2026-09-02T08:01:28.722Z
subject: 🔴 [Flyway 충돌 주의] db/migration 에 제 파일이 하나 들어갑니다 — 그리고 build.gradle·application.properties 를 조금 나눠 써야 합니다

S15P21E201-312 잡으신 걸 봤습니다. 겹치는 게 셋 있어서 미리 알립니다. **제 것이 아직 push 되지 않아서 지금은 안 보이실 겁니다.**

브랜치: `feature/back/S15P21E201-543-recommendation-logging` (추천 로깅)

## 1. 🔴 `db/migration` — Flyway 버전 충돌

제 마이그레이션 파일 하나가 여기 들어갑니다.

```
V20260902090000__recommendation_logging.sql
```

**버전을 순번(V1·V2)이 아니라 UTC 시각으로 적었습니다.** 순번은 두 사람이 동시에 올리면 반드시 충돌하는데 시각은 안 겹칩니다. **인증 쪽 마이그레이션도 같은 방식으로 붙여 주시면** 나중에 머지할 때 아무 일도 안 일어납니다.

만드는 테이블 셋: `recommendation_job` · `recommendation_candidate` · `event_outbox`
👉 인증 쪽과 이름이 겹치지 않으니 테이블 충돌은 없습니다.

## 2. `build.gradle` — 두 줄 묶음이 들어갑니다

```gradle
testImplementation platform('org.testcontainers:testcontainers-bom:1.21.3')
testImplementation 'org.testcontainers:junit-jupiter'
testImplementation 'org.testcontainers:postgresql'
testImplementation 'org.springframework.boot:spring-boot-starter-test'
```

🔴 **Spring Boot 4 의 의존성 관리에 testcontainers 버전이 없습니다.** BOM 을 직접 안 적으면 `Could not find org.testcontainers:postgresql:` 로 빌드가 멈춥니다. 제가 그걸로 한 번 막혔습니다.

## 3. `application.properties` — 지우셔야 할 두 줄이 있습니다

지금 잡고 계셔서 제가 못 고쳤습니다. **아래 두 줄은 이제 존재하지 않는 설정 이름입니다.** 동작에는 영향 없지만(Spring 이 모르는 설정은 무시합니다) 읽는 사람을 속입니다.

```properties
gabolle.recommendation.unknown-constraint-policy=RANK_UNKNOWN_WITH_WARNING   # ← 지워 주세요
gabolle.recommendation.unmarked-unknown-treatment=HARD                        # ← 지워 주세요
```

대신 들어가야 하는 것:

```properties
gabolle.recommendation.unknown-exclusion-threshold=REQUIRED
gabolle.recommendation.unspecified-severity=REQUIRED
```

**편하신 쪽으로 하시면 됩니다** — 지금 지워 주셔도 되고, 반납하신 뒤 제가 고쳐도 됩니다. 알려만 주세요.

## 4. 🟢 하나 도움이 될 것 — `gabolle.persistence.enabled`

`application.properties` 에 이 스위치를 두고, DB 를 쓰는 빈(추천·Outbox)은 이게 `true` 일 때만 만들게 해 뒀습니다.

**왜 있는지가 중요합니다.** 뼈대의 `spring.autoconfigure.exclude` 가 DataSource·JPA·Flyway 를 일부러 빼 놨습니다. 그 상태에서는 **Repository 빈 자체가 안 만들어져서**, Repository 를 주입받는 서비스가 무조건 생성되면 **애플리케이션이 아예 못 뜹니다.**

인증에서 DB 를 켜실 때 그 exclude 세 줄을 지우실 텐데, **그때 이 값도 `true` 로 같이 바꾸시면 됩니다.** 안 바꾸셔도 앱은 뜹니다(추천 빈이 안 만들어질 뿐).

그리고 추천 서비스는 엔진 구현이 없어도 **기동은 되게** 고쳐 뒀습니다(`ObjectProvider`). 인증 작업하시다가 추천 때문에 컨텍스트가 죽는 일은 없을 겁니다 — 그게 안 되던 시기가 있었는데 고쳤습니다.

필요하시면 브랜치 먼저 올리겠습니다. 말씀 주세요.

— kojh0124 (S15P21E201-543)
