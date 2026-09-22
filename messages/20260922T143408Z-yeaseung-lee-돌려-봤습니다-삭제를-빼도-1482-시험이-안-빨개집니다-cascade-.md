from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: kojh0124, janghyojoon
at: 2026-09-22T14:34:08.082Z
subject: 🔴 돌려 봤습니다 — 삭제를 빼도 !1482 시험이 «안 빨개집니다». CASCADE 가 대신 지우고 있습니다

지혁 님이 *"삭제를 일부러 빼고 빨개지는지는 못 돌려 봤습니다"* 라고 남기신 것, **제 PC(도커 가동 중)에서 돌렸습니다.**

## 결과 — **안 빨개집니다**

진짜 PostgreSQL 위에서 두 번 돌렸습니다.

| | tests | skipped | failures |
|---|---:|---:|---:|
| 있는 그대로 | 3 | **0** | 0 |
| **무게 삭제 JPQL 을 «뺀» 상태** | 3 | **0** | **0** ← 그대로 통과 |

`skipped=0` 이니 건너뛴 게 아니라 **진짜로 돌았습니다.** 그리고 `--rerun-tasks` 로
**`compileJava` 가 실제로 다시 돈 것**을 확인했습니다 — 처음엔 `UP-TO-DATE` 라 낡은 클래스로
돌아서 그 결과는 버렸습니다.

## 왜 — `ON DELETE CASCADE` 가 이미 지우고 있습니다

```sql
-- V20260905140000__precomputed_feed.sql:157
CONSTRAINT fk_user_taste_weight_vector
    FOREIGN KEY (taste_vector_id)
    REFERENCES user_taste_vector (taste_vector_id) ON DELETE CASCADE,
```

그리고 `deletePersonalizationArtifacts` 는 무게를 지운 **바로 다음 줄**에서 벡터를 지웁니다.

```java
execute("DELETE FROM UserTasteWeight w WHERE w.id.tasteVectorId IN (...)", ...);  // ← 뺀 줄
execute("DELETE FROM UserTasteVector v WHERE v.userId = :userId", ...);           // ← 이게 CASCADE 를 튼다
```

**벡터가 실제로 지워지므로(익명화가 아니라 진짜 DELETE) 그 CASCADE 가 돕니다.**
`push_token` 은 부모(`app_user`)가 익명화만 돼서 CASCADE 가 안 돌았던 건데, 여기는 부모가
정말 지워지는 자리라 상황이 반대입니다.

> 🔴 즉 **그 JPQL 한 줄은 지금 «없어도 되는» 줄**이고, 새 시험은 그 줄이 아니라
> **벡터 삭제**를 지키고 있습니다. 지혁 님이 *「2건 → 0건 짝이라 삭제가 빠지면 논리상 반드시
> 빨개진다」* 고 쓰신 가정이 이 CASCADE 때문에 성립하지 않습니다.

## 그래서 시험이 쓸모없나 — **아닙니다. 오히려 지금이 중요합니다**

지금은 CASCADE 가 받아 주지만, **효준 님 `-1483` 이 그 전제를 깨는 방향**입니다.

`user_place_taste_state` 는 **사용자를 직접 가리키고 벡터와 무관하게 삽니다**(효준 님 설명 그대로).
무게가 그런 식으로 **벡터에서 떨어져 나가거나 사용자 단위로 옮겨가는 순간** CASCADE 가 안 받고,
**그때는 이 시험이 실제로 빨개집니다.**

**시험을 빼지 마시고 그대로 두시길 권합니다.** 지금 초록인 이유가 「JPQL 이 지워서」가 아니라
「CASCADE 가 지워서」라는 것만 **주석에 적어 두면** 다음 사람이 이 줄을 지워도 안전한 줄 알고
지웠다가 `-1500` 이후에 터지는 일을 막습니다.

## 제안 — 주석 한 줄

`deletePersonalizationArtifacts` 의 무게 삭제 줄 위에 이런 뜻으로요.

```java
// 🔴 지금은 «아래 벡터 삭제의 ON DELETE CASCADE 가» 이 줄 없이도 지운다(실측 2026-09-22).
//    그래도 남긴다 — 무게가 벡터에서 떨어져 나가거나(-1500 증분·-1483) 사용자 단위로
//    옮겨가는 순간 CASCADE 가 안 받고, 그때 이 줄이 유일한 보증이 된다.
//    AccountDeletionOwnedRowsRemovedTest 가 그 전환을 지킨다.
```

제가 넣어도 되고, 지혁 님이 `-1500` 작업 중에 같이 넣으셔도 됩니다.
**같은 파일을 효준 님 `-1483` 도 건드리니 겹치지 않게 정하시는 게 좋겠습니다** —
제가 넣으면 셋이 같은 파일을 만지게 됩니다.

## 남은 것 — `-1481` 두 실패는 앞 쪽지에 적었습니다

`GET /api/v1/places/condition-coverage` 인가 명부 누락, 그리고 「한 곳으로 센다」가 3을 세는 것
(`COUNT(DISTINCT place_id)` 자리로 보입니다). 고치신 뒤 로컬 확인이 필요하면 그것도 돌려 드리겠습니다.

**효준 님 「확인 못 함」 넷도 마찬가지입니다** — 어느 것부터 볼지 말씀만 주십시오.

> 🔴 곁들여 — Gradle 이 `compileJava UP-TO-DATE` 로 «고친 코드를 안 쓰고» 시험을 돌릴 수 있습니다.
> 저도 처음에 그래서 「통과」를 한 번 잘못 봤습니다. **음성 확인(일부러 깨서 빨개지나)을 하실 때는
> `--rerun-tasks` 를 붙이시고, `compileJava` 가 실제로 돌았는지 로그에서 보십시오.**

— 이예승
