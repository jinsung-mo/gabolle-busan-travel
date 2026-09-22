from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: kojh0124
at: 2026-09-22T15:06:56.834Z
subject: [정정] !1481 실패 둘 — DISTINCT 는 이미 있었습니다. 진짜 원인은 「남이 남긴 줄」이고, 도커로 재현했습니다

## 먼저 정정합니다

앞서 제가 **「`COUNT(DISTINCT place_id)` 자리로 보입니다」** 라고 보냈는데 **틀렸습니다.**
`PlaceFeatureRepository` 57번째 줄의 질의는 **이미** `COUNT(DISTINCT f.placeId)` 입니다.
코드를 안 읽고 증상만 보고 짐작한 것이고, 그 짐작대로 고치면 아무것도 안 바뀝니다.
시간 쓰셨다면 죄송합니다.

아래는 짐작이 아니라 **제 PC 의 진짜 PostgreSQL 에서 실제로 돌려 본 결과**입니다.

---

## 실패 ①  `ConditionCoverageQueryIntegrationTest` — `expected: 1L but was: 3L`

### 실측

| 어떻게 돌렸나 | 결과 |
|---|---|
| 이 시험 클래스 **혼자** | **3건 전부 통과** |
| `PlaceFeatureCodeMapTest` · `PlaceDataQualityServiceTest` 와 **같이** | **`expected: 1L but was: 3L`** |

아래가 CI 로그와 **글자까지 같습니다.** 재현됐습니다.

```
org.opentest4j.AssertionFailedError:
expected: 1L
 but was: 3L
```

### 원인

질의는 맞습니다. **시험이 「전역 절대값」을 봅니다.**

```java
assertThat(countsOf("ALLERGEN_TAG").get("ALLERGEN_TAG")).isEqualTo(1L);
```

`countsOf` 는 표 전체를 셉니다 — 그 시험이 넣은 장소만 세는 게 아닙니다.
그런데 통합시험은 **한 데이터베이스를 나눠 씁니다**(`TestDatabase` 가 JVM 당 하나만 띄웁니다).
그래서 남이 남긴 줄이 그대로 더해집니다.

**남기는 쪽은 `PlaceFeatureCodeMapTest` 입니다.** 정리를 **아예 안 합니다**(`@AfterEach` 도
`DELETE` 도 없습니다). 그 안의 시험 **둘**이 각각 `ALLERGEN_TAG` / `VERIFIED` 장소를
하나씩 영구히 남깁니다.

- `mappedPlaceFeatureTypesAreStorable` — 대조표의 모든 갈래를 한 장소에 넣는데,
  안전 갈래는 `VERIFIED` 로 넣습니다 → `ALLERGEN_TAG` 장소 **1곳**
- `safetyFeatureStillAcceptsVerifiedAndUnknown` — `verifiedPlace` 에 `VERIFIED` 로 넣습니다
  → `ALLERGEN_TAG` 장소 **1곳** (`UNKNOWN` 쪽은 질의가 빼므로 안 세집니다)

**2 + 지혁 님 시험이 넣은 1 = 3.** 딱 맞습니다.

그리고 이건 **`PlaceFixture` 가 자기 주석에 이미 적어 둔 규칙**입니다 —
*「다른 통합 테스트가 같은 표에 행을 남기고 정리하지 않는다 … **건수는 절대값이 아니라
증분으로 본다**」*. 같은 클래스의 첫 시험은 그 규칙을 지켜서(`isGreaterThanOrEqualTo(1L)`)
통과했고, 이 시험만 `isEqualTo` 라 걸렸습니다.

### 고치는 법 — 증분으로 봅니다

시험이 지키려는 성질(**줄이 아니라 장소로 센다**)은 그대로 남습니다. 줄로 세면 +3,
장소로 세면 +1 이니까요.

```java
@Test
@DisplayName("🔴 한 장소에 같은 갈래가 여러 줄이어도 «한 곳»으로 센다")
void onePlaceWithManyRowsCountsOnce() {
	// 이 표는 통합시험이 나눠 쓰고, 정리하지 않는 시험도 있다(PlaceFeatureCodeMapTest).
	// 그래서 절대값이 아니라 «내가 넣어서 얼마나 늘었나» 를 본다 — PlaceFixture 주석의 규칙.
	long before = countsOf("ALLERGEN_TAG").getOrDefault("ALLERGEN_TAG", 0L);

	UUID placeId = this.fixture.insertPlace("여러줄장소", null, "FOOD", 35.11, 129.01);
	this.fixture.insertTagFeature(placeId, "ALLERGEN_TAG", "PEANUT", "VERIFIED", "true");
	this.fixture.insertTagFeature(placeId, "ALLERGEN_TAG", "SHRIMP", "VERIFIED", "true");
	this.fixture.insertTagFeature(placeId, "ALLERGEN_TAG", "MILK", "VERIFIED", "true");

	long after = countsOf("ALLERGEN_TAG").getOrDefault("ALLERGEN_TAG", 0L);

	// 줄로 세면 +3, 장소로 세면 +1 이다. 줄로 세면 알레르기 표식 열 줄이 붙은 한 곳이
	// 「열 곳」이 되어 화면이 자료가 넉넉한 줄 안다.
	assertThat(after - before).isEqualTo(1L);
}
```

---

## 실패 ②  `RouteAuthorizationRegistryTest`

새로 만드신 `GET /api/v1/places/condition-coverage` 가 **정책 표에 없습니다.**
저도 `S15P21E201-1363` 때 똑같은 데 걸렸습니다 — 새 경로를 만들면 이 표에 한 줄을
적어야 통과합니다. 「빠뜨렸다」와 「일부러 공개다」를 코드가 못 가르기 때문입니다.

`RouteAuthorizationRegistryTest` 의 `GET /api/v1/places/categories` 줄 **바로 아래**가
자리입니다. 그 줄과 성격이 같습니다(요청자와 무관한 공용 기준 데이터).

```java
put(m, "GET /api/v1/places/condition-coverage", Policy.AUTHENTICATED_ONLY,
		"문항마다 판정할 장소 자료가 몇 곳에 있나(-1508). 요청자와 무관한 공용 기준 데이터라 "
				+ "facets · categories 와 같은 정책이다. ConditionCoverageQueryIntegrationTest");
```

---

## 덤 — 이 건과 별개인 지뢰 하나

`PlaceDataQualityServiceTest` 가 `@BeforeEach` 에서 이렇게 합니다.

```java
this.jdbcTemplate.update("DELETE FROM place_feature");
this.jdbcTemplate.update("DELETE FROM place");
```

**표를 통째로 비웁니다.** `PlaceFixture` 주석이 하지 말라고 못 박은 바로 그것이고,
같은 데이터베이스를 쓰는 다른 통합시험의 행을 지웁니다. 지금은 순서 덕에 안 터지지만,
시험이 하나 늘거나 순서가 바뀌면 **엉뚱한 시험이 빨개집니다.** 지혁 님 MR 과는 무관하니
여기서 고치자는 말은 아니고, 남겨 둡니다.

---

## 제안

고치신 뒤에 **제가 대신 돌려 드리겠습니다.** 지금 팀에서 도커가 켜져 있는 건
제 PC 뿐이라(효준 님 것은 꺼져 있습니다) 통합시험이 로컬에서 「건너뜀」으로 나올 겁니다 —
그 초록은 검증된 초록이 아닙니다. 쪽지 주시면 바로 돌리겠습니다.

— 이예승
