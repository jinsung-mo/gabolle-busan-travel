from: kojh0124
to: ahwlstjd57
at: 2026-09-03T03:07:47.132Z
subject: 🔴 [-461 매핑 전에] PreferenceSnapshot 이 answer_status 를 담을 수 없습니다 — 지금이 제일 쌉니다

고지혁입니다. 표는 들어갔습니다 (MR !93 · !94 머지). 그런데 **표를 채우는 쪽 모양에
칸이 없어서** 매핑을 쓰기 전에 알립니다. 지금 고치면 필드 하나, 매핑을 쓴 뒤면 재작업입니다.

## 1. 먼저 — 여행이 아직 메모리입니다

`InMemoryTripRepository` 가 `TripRepository` 의 **유일한 구현**이고 `@Repository` 에
프로필 조건이 없습니다. 그래서 어느 프로필로 띄워도 `POST /api/v1/trips` 는
HashMap 에 적습니다. **`trip` 표는 만들어졌는데 비어 있습니다.**

이건 JPA 구현 하나로 끝나는 일입니다. 문제는 그 다음입니다.

## 2. 🔴 `Map<String, String>` 에는 응답 상태가 들어갈 자리가 없습니다

```java
// PreferenceSnapshot
private final Map<String, String> dimensions;   // 차원 → 값
```

이 모양이 말할 수 있는 것은 **"이 차원에 이 값이 있다"** 와 **"키가 없다"** 둘뿐입니다.
그런데 -542 2.1 이 구분하라는 것은 셋입니다.

| | 뜻 | `Map` 으로 표현 |
|---|---|---|
| `SELECTED` | 골랐다 | 키 있음 ✅ |
| `SKIPPED` | 봤지만 건너뜀 | 🔴 키 없음 |
| `UNKNOWN` | 아예 묻지 않았다 | 🔴 키 없음 — **위와 구별 불가** |

**키가 없는 것이 두 가지 뜻을 갖습니다.**

### 그래서 실제로 벌어질 일

매핑을 그대로 쓰면 `preference_answer` 에 **있는 키만 행이 되고 전부
`answer_status='SELECTED'`** 가 됩니다. `SKIPPED` · `UNKNOWN` 행은 아무것도 안 들어갑니다.

🔴 **그리고 아무것도 빨개지지 않습니다.** 제 CHECK 는 "SELECTED 인데 값이 없다" 를 막는
것이라, 값 있는 SELECTED 만 들어오면 통과합니다. 표는 멀쩡해 보이는데
**"취향 질문을 몇 명이 건너뛰었나" 는 영영 못 세게 됩니다.**

그쪽이 Outbox 에서 찾아낸 것과 같은 종류입니다 — 표는 있는데 안이 비고, 그게 오류로
안 나타납니다. 그때는 리포지토리가 둘이어서였고, 이번엔 중간 모양에 칸이 없어서입니다.

### 🔴 양쪽 끝은 이미 그걸 보낼 준비가 돼 있습니다

- **FE** — 진미리 님이 *"`answer_status` 로 선택함·해당 없음·건너뜀·모름을 값과 분리하고
  `scope` 도 계정 기본값과 이번 여행 전용으로 구분하겠다"* 고 답하셨습니다
- **DB** — `preference_answer` 가 그 셋을 요구합니다

**가운데만 못 나릅니다.** 그러면 FE 가 보낸 구분이 서버에서 사라집니다.

## 3. 제약 쪽도 같습니다

`TripConstraint` 는 `type · severity · operator · value · threshold · evidenceStatus` 인데
**`answer_status` 와 `scope` 가 없습니다.**

- 🔴 **"알레르기 없습니다"(`NONE`)와 "안 물어봤습니다"(`UNKNOWN`)를 구별할 수 없습니다.**
  알레르기에서 이건 분석 문제가 아니라 안전 문제입니다 — 안 물어본 것을 "없다" 로
  읽으면 위반 장소가 통과합니다
- `scope` 가 없으면 이번 여행에서 고친 값이 계정 기본값을 덮어씁니다 (-542 2.2)
- 참고로 제 표는 제약에 `SKIPPED` 를 **거부**합니다. 없으면 `NONE` 을 명시해야 합니다

## 4. 제안하는 모양

```java
public enum AnswerStatus { SELECTED, SKIPPED, UNKNOWN }   // 제약은 NONE 이 SKIPPED 를 대신
public enum Scope { USER, TRIP }

public record PreferenceAnswer(String dimension, String valueJson, AnswerStatus status) {}

// PreferenceSnapshot
private final List<PreferenceAnswer> answers;   // Map<String, String> 대신
private final Scope scope;
```

`TripConstraint` 에는 `answerStatus` 와 `scope` 를 더하시면 됩니다. `severity` 는 그대로
쓰시고 — 제 표의 `hard` 와 맞습니다 (🔴 `ALLERGY` 는 `hard=false` 로 저장이 안 됩니다).

값 자체는 `Map` 이 아니라 JSON 문자열로 두시는 편이 낫습니다. 다중값·척도값이 오면
`String` 이 모자랍니다 (제 `value` 는 `JSONB` 입니다).

## 5. 컬럼 이름

```
preference_answer   preference_snapshot_id · dimension · value(JSONB) · answer_status · created_at
constraint_answer   constraint_snapshot_id · constraint_type · constraint_key · value(JSONB)
                    · hard · answer_status · (알레르기: cross_contact_policy ·
                    other_allergy_ciphertext · encryption_key_version · encryption_nonce)
                    · (식단: diet_requirement · verification_policy)
preference_snapshot / constraint_snapshot
                    <이름>_snapshot_id · user_id · trip_id(USER 면 NULL) · version · scope · created_at
```

`MOBILITY` 는 `constraint_key`(`MAX_WALKING_METERS` · `WHEELCHAIR` · `STROLLER` ·
`HEAVY_LUGGAGE` · `STAIRS_AVOIDANCE`)로 **사실마다 한 행**입니다. 넓은 한 행이면 응답
상태를 사실마다 가질 수 없어서 "휠체어는 답했고 계단은 안 물어봤다" 를 적을 칸이
사라집니다 — 위와 같은 이유입니다.

## 6. 🔴 M1 전날인 것 압니다 — 그래서 미룰 때의 최소선도 적습니다

지금 도메인 모양을 바꾸라는 얘기라 "M1 지나고 하자, 일단 SELECTED 만 적자" 가 합리적인
반론입니다. 시연이 내일이면 저도 그 판단을 이해합니다.

**다만 대가가 되돌릴 수 없는 종류입니다.** 고치기 전에 만들어진 여행은
`SKIPPED` · `UNKNOWN` 이 **없는 게 아니라 안 물어본 것처럼도 안 남습니다.**
나중에 재구성할 방법이 없습니다 — 그 사람에게 무엇을 안 물어봤는지는 어디에도 없습니다.

**미루실 경우의 최소선 하나만 부탁드립니다.** 모양은 그대로 두시더라도,
**FE 가 보낸 요청 본문 전체를 `preference_set` 이벤트 payload 로 Outbox 에 그대로
적어 주십시오.** 그러면 정규화는 못 돼도 원본이 남아서 나중에 backfill 이 됩니다.
이벤트 경로는 어제 그쪽이 고쳐 놔서 이미 DB 로 갑니다.

원본만 남으면 M1 뒤에 제가 채워 넣겠습니다. 원본이 없으면 그건 못 합니다.

## 부탁

`feat/back/S15P21E201-461-trip-query` 잡고 계신 걸 봤습니다. 그 코드 안에 계신 동안에
필드를 더하는 게 제일 쌉니다. **매핑을 다 쓴 뒤에 고치면 엔티티·DTO·테스트가 같이 움직입니다.**

`db/migration` 은 반납했습니다. `itineraries` 쪽 시작하셔도 됩니다.

— 고지혁
