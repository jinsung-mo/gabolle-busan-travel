from: kojh0124
to: ahwlstjd57
at: 2026-09-04T00:40:13.508Z
subject: [답 셋] HEALTH_DIET 은 DIET + REQUIRED 입니다 — 지금 그쪽 민감 판정에 구멍이 있습니다. constraint_key 는 제 스키마 결함이 맞습니다

고지혁입니다. 어제 06:02 질문에 늦게 답합니다 — 하루 붙잡아 뒀습니다. 그 사이 place 표까지
올려 주셔서 `-545` 가 풀렸습니다. `evidence_status=UNKNOWN` 이면 `value` 가 NULL 이어야 하는
CHECK, 그게 정확히 필요한 것이었습니다. `feature_type`·`feature_key` 값 목록을 비워 두신 것도
그대로 제 몫으로 받겠습니다.

순서를 바꿔서 3번부터 답합니다. **그게 안전 문제라서요.**

## 3. 🔴 `HEALTH_DIET` 은 별도 개념이 아닙니다 — `DIET` + `diet_requirement='REQUIRED'` 입니다

같은 것을 다른 이름으로 부르고 있었습니다. 명세가 그 구분을 **type 이 아니라 requirement 로**
합니다 (-542 5.2).

```
constraint_type   ALLERGY | DIET | MOBILITY        ← 셋뿐
diet_requirement  REQUIRED | PREFERRED             ← 여기가 갈리는 자리
```

즉 이렇게 대응됩니다.

| 그쪽 이름 | 제 스키마 |
|---|---|
| `HEALTH_DIET` (의료·종교상 지켜야 하는 것) | `DIET` + `diet_requirement='REQUIRED'` |
| 선호 기반 식단 | `DIET` + `diet_requirement='PREFERRED'` |

`HALAL`·`GLUTEN_FREE`(체강증)·`LACTOSE_FREE` 는 REQUIRED 로, `VEGETARIAN`(선호) 는
PREFERRED 로 들어갑니다. 같은 코드가 사람에 따라 양쪽 다 될 수 있어서 **코드가 아니라
requirement 가 판정 기준**인 것입니다.

### 🔴 그래서 지금 그쪽 판정에 구멍이 있습니다

`isSensitiveType()` 이 `"ALLERGY"`·`"HEALTH_DIET"` 를 막는데, **DB 에는 `HEALTH_DIET` 라는
값이 아예 안 들어갑니다.** 전부 `DIET` 로 들어옵니다. 그러면 그 검사는

- `ALLERGY` → 막힘 ✅
- `DIET` (REQUIRED 인 것 포함) → **안 막힘** 🔴

즉 **의료상 지켜야 하는 식단이 민감 정보 취급을 못 받고 일반 로그로 흘러갑니다.**
-542 10장이 *"알레르기·건강성 식단·정밀 위치는 일반 행동 로그와 분리하고 접근을 통제한다"*
로 못 박은 자리입니다.

**고칠 방향** — 판정을 type 하나가 아니라 type + requirement 로 보셔야 합니다.

```java
boolean isSensitive() {
    return type == ALLERGY
        || (type == DIET && dietRequirement == REQUIRED);
}
```

`ALLERGY` 는 requirement 를 안 봅니다 — 알레르기는 항상 하드이고 항상 민감합니다
(제 표에 `CHECK (constraint_type <> 'ALLERGY' OR hard)` 가 그래서 있습니다).

## 2. `constraint_key` 맞습니다 — 그리고 🔴 그 다음이 제 스키마 결함입니다

`NUT_FREE`·`PEANUT`·`HALAL` 같은 구체 코드는 **`constraint_key` 자리**가 맞습니다.
`value` 가 아닙니다. 제 마이그레이션 주석에도 그렇게 적혀 있습니다 — *"ALLERGY 는 알레르기
코드, DIET 는 식단 코드, MOBILITY 는 이동 조건 이름."*

**그런데 그 다음 질문("그러면 value 에는 뭐가 들어가나")이 제 결함을 찾아냈습니다.**

지금 CHECK 가 이렇습니다.

```sql
CHECK ((answer_status = 'SELECTED') = (value IS NOT NULL))
```

`SELECTED` 면 `value` 가 **반드시** 있어야 합니다. 그런데 종류별로 실제 사정이 다릅니다.

| | `constraint_key` | `value` 에 담을 것 |
|---|---|---|
| `MOBILITY` | `MAX_WALKING_METERS` | `{"meters": 1500}` — **진짜 필요** |
| `MOBILITY` | `WHEELCHAIR` | 없음 (키 자체가 정보) |
| `ALLERGY` | `PEANUT` | **없음** — 코드가 정보 전부 |
| `DIET` | `HALAL` | **없음** — `diet_requirement` 가 별도 칸 |

🔴 즉 제 CHECK 가 `ALLERGY`·`DIET` 에 **의미 없는 JSON 을 억지로 넣게 만듭니다.**
제 테스트도 `{"severity":"HARD"}` 를 넣고 있는데, 그건 `hard` 칸과 중복입니다.
그쪽이 `value` 에 코드를 넣고 있던 것은 **스키마가 그렇게 강요했기 때문**입니다.

**제가 고칩니다.** CHECK 를 둘로 나눕니다.

```sql
-- 안 고른 답은 값을 실을 수 없다 (그대로 유지)
CHECK (answer_status = 'SELECTED' OR value IS NULL)

-- 값이 정보를 담는 종류만 값을 요구한다
CHECK (constraint_type <> 'MOBILITY'
       OR answer_status <> 'SELECTED'
       OR value IS NOT NULL)
```

이러면 `ALLERGY PEANUT SELECTED value=NULL` 이 정상이 되고, `MOBILITY MAX_WALKING_METERS`
는 여전히 숫자를 요구합니다. **엔티티에서 억지로 채우지 마시고 NULL 로 두십시오.**
마이그레이션은 제가 올리고 알리겠습니다.

## 1. `time_window` — 🔴 버리지만 말아 주십시오

프리셋 목록과 시간 범위는 **제가 혼자 정할 수 없습니다.** 명세 4.2 에는
`time_window_start`/`time_window_end`(TIME) 만 있고 프리셋 목록이 없습니다. 화면이 무엇을
주는지가 계약이라, `preferenceSnapshotVersion` 때와 같은 3자(BE·FE·DATA) 사안입니다.
진미리 님이 `-458`·`-459`·`-460` 으로 그 화면을 만들고 계시니 그쪽 답이 먼저입니다.

**다만 지금 상태가 제일 나쁩니다 — 값이 조용히 버려집니다.**

-542 2.3 이 *"수집 시 즉시 변환하지 않는다. 원자적인 것을 보존한다"* 고 합니다.
프리셋이 **사용자가 실제로 고른 것**이고 시각 두 칸은 **파생값**입니다. 그러니 원본을
남기고 파생은 나중에 채우는 것이 순서입니다.

**제안** — `trip` 에 칸 하나 더합니다.

```sql
ALTER TABLE trip ADD COLUMN time_window_preset VARCHAR(40);
```

- 그쪽은 프리셋 문자열을 **그대로** 여기 넣으십시오. 변환하지 마십시오
- `time_window_start`/`end` 는 NULL 로 두십시오. 프리셋 목록이 확정되면 제가 파생 규칙을
  넣고 채웁니다
- 🔴 지금 버리면 **되돌릴 방법이 없습니다.** "그 사용자가 언제 다닐 수 있다고 했는가" 는
  나중에 재구성할 수 없습니다. `answer_status` 때와 같은 종류입니다

프리셋 목록을 미루는 것에는 동의합니다. **버리는 것에만 동의하지 않습니다.**

## 제가 올릴 것

마이그레이션 하나로 둘을 함께 처리하겠습니다.

1. `constraint_answer` CHECK 를 둘로 분리 (2번)
2. `trip.time_window_preset` 추가 (1번) — 이견 있으면 빼고 갑니다

진미리 님께는 프리셋 목록을 따로 여쭙겠습니다. **3번(민감 판정)은 그쪽 코드라 부탁드립니다** —
그게 셋 중 유일하게 안전에 걸리는 것입니다.

— 고지혁
