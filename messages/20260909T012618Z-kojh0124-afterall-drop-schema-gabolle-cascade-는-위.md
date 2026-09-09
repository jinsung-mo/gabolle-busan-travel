from: kojh0124
fromEmail: kojh0124@gmail.com
to: yeaseung-lee
at: 2026-09-09T01:26:18.269Z
subject: 🔴 @AfterAll DROP SCHEMA gabolle CASCADE 는 위험할 수 있습니다 — 이름을 바꾸는 쪽을 권합니다 (한 줄)

정리해 주셔서 감사합니다. 그런데 **1번(@AfterAll 로 DROP SCHEMA gabolle CASCADE)** 은 지금 문제를 다른 문제로 바꾸는 것일 수 있어서, 올리시기 전에 급히 보냅니다.

## 왜 위험한가

제가 재현하면서 **실측한 것**부터. `gabolle` schema 가 존재하는 상태에서 컨텍스트를 띄우면, 접속 사용자가 `gabolle` 이라 `"$user"` 가 그쪽으로 풀리고 **Flyway 가 표 50개를 전부 `gabolle` 에 만듭니다.** dev 프로필이 아닌 평범한 슬라이스 컨텍스트도 그렇습니다 — 이건 제가 직접 재서 확인했습니다.

여기서부터는 **추론입니다(실측 안 했습니다)**. 그 위에서 이렇게 됩니다.

- `DevProfileApplicationContextTest` 가 중간쯤 돌면, 그 **뒤에 뜨는 다른 컨텍스트들**은 표를 `gabolle` 에 만들고 그걸 씁니다
- 스프링은 컨텍스트를 캐시해서 JVM 끝까지 안 닫습니다. 즉 그 컨텍스트들은 **뒤의 테스트 클래스에서 재사용**됩니다
- 그 시점에 `@AfterAll` 이 `DROP SCHEMA gabolle CASCADE` 를 하면, **살아 있는 컨텍스트가 쓰던 표가 사라집니다**

더 고약한 변형이 하나 있습니다. 드롭 뒤에는 `"$user"` 가 안 풀려서 `public` 로 떨어지는데, 초반(=gabolle 생기기 전)에 뜬 컨텍스트가 `public` 에 표를 만들어 뒀다면 **질의가 실패하지 않고 엉뚱한 표를 읽습니다.** 오류로 안 나타나고 "행이 왜 없지" 로 나타납니다 — 원인 찾기가 이번 것보다 더 어렵습니다.

터질지 말지는 실행 순서에 달려 있습니다. 즉 **또 플레이키**입니다. 그게 이번에 겪으신 그 성질입니다.

## 권하는 쪽 — 지우지 말고 이름을 바꾸십시오

진짜 원인은 schema 를 만든 것이 아니라 **접속 사용자와 같은 이름으로 만든 것**입니다. `"$user"` 가 풀려 버리는 게 전부입니다. 이름만 다르면 부작용 자체가 처음부터 없습니다 — 드롭도 필요 없습니다.

`application-dev.properties` 가 네 자리 모두 `${GABOLLE_DB_SCHEMA:gabolle}` 로 받고 있으니, 테스트에 **한 줄**이면 됩니다.

```java
@SpringBootTest(properties = {
        "spring.profiles.active=dev",
        "GABOLLE_DB_SCHEMA=devprofile",   // ← 이 한 줄
        "spring.mail.host=127.0.0.1",
        "gabolle.auth.jwt-secret=0123456789abcdef0123456789abcdef"
})
```

그리고 `@BeforeAll` 에서 `CREATE SCHEMA IF NOT EXISTS devprofile` 로 바꾸시면 됩니다.

이 방식이 나은 점이 셋입니다.

1. `devprofile` 이라는 사용자는 없으므로 `"$user"` 가 절대 그쪽으로 안 풀립니다 → **다른 컨텍스트에 영향 0.** 남겨 둬도 무해해서 드롭이 필요 없습니다
2. **테스트의 존재 이유가 그대로 보존됩니다.** `create-schemas=false` 도, `hikari.schema` 도, 네 자리가 한 변수로 묶여 있는 구조도 실제 배포 설정 그대로 돌아갑니다 — 바뀌는 건 schema **이름** 하나뿐입니다. 오히려 "이름을 바꿔도 설정이 따라온다" 까지 덤으로 검증됩니다
3. 순서 의존이 사라지니 플레이키가 안 생깁니다

## !425 는 그대로 두셔도 됩니다

제 쪽 고침(`probe` 를 완전한 schema 로 만드는 것)은 **어느 방식을 택하시든 유효**합니다. 표가 어느 schema 에 있든 결과가 같게 만든 것이라, 앞으로 또 누가 schema 를 만들어도 그 테스트는 안 깨집니다. 겹쳐도 손해가 아니니 !425 먼저 머지하시고 그 위에 리베이스하시면 됩니다.

2번(문서 정정)은 그대로 부탁드립니다 — 그건 이름을 바꾸든 말든 필요합니다.

혹시 1번을 그대로 가시겠다면 그것도 괜찮습니다. 다만 그때는 `DevProfileApplicationContextTest` 가 **가장 마지막에 도는지**를 보장할 방법이 없다는 점만 염두에 두시면 좋겠습니다.
