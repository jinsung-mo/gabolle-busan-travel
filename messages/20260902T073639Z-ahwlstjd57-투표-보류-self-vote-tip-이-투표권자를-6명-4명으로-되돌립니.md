from: ahwlstjd57
to: all
at: 2026-09-02T07:36:39.223Z
subject: 🔴 [투표 보류] self-vote-tip 이 투표권자를 6명→4명으로 되돌립니다 + 이벤트 사전 확정(recommendation_failed 추가)

모진성입니다. **두 가지인데 첫 번째가 급합니다 — 지금 그 브랜치에 표를 던지면 안 됩니다.**

---

# 1. 🔴 `hotfix/…-self-vote-tip` 에 표를 던지지 마십시오

표를 던지려고 13파일을 검토했는데 **머지하면 안 되는 상태**입니다.

## 투표권자 명단이 되돌아갑니다

```
main 의 투표권자                     6명
  rleaderjoon · masdf13 · yeaseung.lee96 · jinmiri · ahwlstjd57 · kojh0124

hotfix/…-self-vote-tip 의 투표권자    4명
  rleaderjoon · masdf13 · yeaseung.lee96 · jinmiri
                                      🔴 ahwlstjd57 · kojh0124 가 없습니다
```

`git diff` 에서 이렇게 잡힙니다.

```diff
-  "//voters-2026-09-01": "🔴 2026-09-01 추가 — 모진성(ahwlstjd57@gmail.com)과 고지혁(kojh0124@gmail.com)..."
-    { "id": "ahwlstjd57", "email": "ahwlstjd57@gmail.com" },
-    { "id": "kojh0124", "email": "kojh0124@gmail.com" }
```

## 왜 이렇게 됐나 — 브랜치가 4일 동안 열려 있는 사이에 main 이 바뀌었습니다

```
8-27  2d4ffe3  ← 이 브랜치가 갈라진 지점 (투표권자 4명)
        │
        ├─ 8-28  hotfix/…-self-vote-tip   (self_vote:tip 추가, 명단은 4명 그대로)
        │
9-01  68c3d3f  main: 모진성·고지혁을 명단에 올린다   ← 🔴 브랜치는 이걸 모릅니다
9-01  cae3388  main: 머지
```

## 🔴 그리고 이게 브랜치 자기 목적을 깎습니다

이 브랜치의 목적은 *"`common/dev` 의 던질 수 있는 사람을 1명 → 3명으로"* 입니다. 그런데 머지되면 **투표권자가 6명 → 4명**이 됩니다. 명단을 6명으로 늘려 둔 것이 병목 해소의 절반이었는데 그 절반이 사라집니다.

## 결함 둘 더

**① `vote_note.since` 가 이미 과거입니다**

```json
"vote_note": { "min_chars": 20, "since": "2026-09-01T00:00:00Z" }
```

정책 주석이 스스로 이렇게 적어 뒀습니다 — *"`since` 가 왜 필요한가 — **소급 금지 하나 때문이다.** … 그래서 **이 MR 이 머지되는 날보다 뒤로 잡는다.**"*

🔴 오늘이 **9-02** 입니다. `since` 가 지났습니다. *(현재 0표라 실제 피해는 없지만 머지 전에 미래로 옮겨야 합니다.)*

**② 벤더 핀이 함께 바뀝니다** — `4556679`(8-26) → `b702eff`(8-28). 순서 자체는 `-33` 먼저가 맞지만, 위 `policy.json` 되돌림과 별개로 확인이 필요합니다.

## 필요한 것 — rebase

```bash
git switch hotfix/S15P21E201-33-self-vote-tip
git rebase origin/main
# policy.json 충돌 해소 — voters 6명을 유지하고 self_vote·vote_note 를 얹습니다
# vote_note.since 를 머지 예정일보다 뒤로 (예: 2026-09-03T00:00:00Z)
git push --force-with-lease
```

🟢 **지금 0표라서 잃을 것이 없습니다.** 표가 모인 뒤에 push 하면 다 무효가 되니, **지금이 고칠 적기입니다.**

## 정책 내용 자체는 타당합니다

`self_vote: "tip"` 의 논거는 맞습니다. 실측 근거(`common/dev` 4명 중 3명이 커밋 → 던질 사람 1명, 수학적으로 도달 불가)가 명확하고, *"혼자 올리고 혼자 통과 는 여전히 막는다"* 도 맞습니다. **내용이 아니라 브랜치 상태가 문제입니다.** rebase 되면 바로 던지겠습니다.

🔴 **그전에는 다른 투표권자도 던지지 마십시오** — 모르고 던지면 자기 투표권을 없애는 변경에 찬성하게 됩니다.

---

# 2. 이벤트 사전 확정 — `recommendation_failed` 를 넣습니다 (고지혁 님 질문 답)

*"버전을 알기 전에 실패한 요청을 분석팀에 어떻게 알릴까"* 에 대한 답입니다. **②번(별도 이벤트)으로 갑니다.**

## ①번(버전 필수 완화)을 안 고르는 이유

`"버전 있으면 넣기"` 로 바꾸면 **엔진이 정상일 때도 버전 없는 이벤트가 통과합니다.** NFR-08 재현성이 통째로 약해집니다. **예외를 만들려고 규칙을 없애는 것**이 됩니다.

## ②번의 "나쁜 점" 은 사실상 없습니다

지적하신 *"목록에 항목이 하나 늘어난다"* 가 부담인 이유는 FE·APP 이 계측을 넣어야 하기 때문인데,

```
recommendation_failed  →  producer: SERVER
```

**서버 Outbox 가 만드는 것이라 FE·APP 은 아무것도 안 합니다** (DR-13). 목록에 늘어도 그쪽 작업은 0입니다.

## 🔴 다만 문제를 다시 정의해야 합니다 — 버전은 한 덩어리가 아닙니다

| 버전 | 누가 아는가 | 엔진이 꺼져도 |
|---|---|---|
| `ontologyVersion` | 우리 서버 | ✅ 안다 |
| `datasetVersion` | 우리 서버 | ✅ 안다 |
| `policyVersion` | 우리 서버 | ✅ 안다 |
| `modelVersion` | 🔴 엔진이 알려준다 | ❌ 모른다 |
| `featureVersion` | 🔴 엔진이 알려준다 | ❌ 모른다 |

**"버전 전부 필수" 는 애초에 지킬 수 없는 요구입니다.** `fallbackMode: BASELINE` 이면 모델을 안 쓴 것이고, 그때 `modelVersion` 이 없는 건 결함이 아니라 **정확한 사실**입니다.

### 그래서 fallbackMode 가 요구 버전을 결정합니다

```
MODEL     → model · feature · ontology · dataset · policy   (5개 전부)
RULE      → ontology · dataset · policy                     (model·feature 없음)
BASELINE  → dataset · policy
실패      → 아는 것만. 없는 것은 null   (recommendation_failed 한정 예외)
```

성공 이벤트의 필수 규칙은 안 흔들고 **실패 이벤트에만 예외**를 둡니다.

## 확정 — `recommendation_failed`

| | |
|---|---|
| eventType | `recommendation_failed` |
| producer | **SERVER** (Outbox) — FE·APP 작업 없음 |
| M1 필수 | ✅ |
| 필수 필드 | `request_id` · `job_id` · `trip_id` · `failure_code` · `failed_stage` · `fallback_attempted` · `occurred_at` |
| 버전 | 아는 것만. 없으면 null |

`failed_stage` 는 Job 의 진행 단계를 그대로 씁니다 — `CANDIDATE_GENERATION` · `CONSTRAINT_EVALUATION` · `RANKING` · `ROUTE_OPTIMIZATION` · `FINALIZING`. **어디서 죽었는지가 실패 분석의 핵심**입니다.

## 🔴 그리고 하나 더 못 박습니다 — `recommendation_requested` 를 접수 즉시 발행

지적하신 *"엔진이 꺼져 있던 시간대가 아예 없었던 것처럼 보인다"* 의 뿌리가 여기입니다.

**엔진을 부르기 전, 요청 접수 시점에** `recommendation_requested` 를 발행하면 구멍이 닫힙니다. 그때는 서버가 아는 버전 3개만 담습니다. 그러면 분석이 조인 없이 됩니다.

```sql
SELECT date_trunc('hour', occurred_at) AS h,
       count(*) FILTER (WHERE event_type = 'recommendation_requested') AS 요청,
       count(*) FILTER (WHERE event_type = 'recommendation_failed')    AS 실패
FROM event_outbox GROUP BY 1 ORDER BY 1;
```

## 🟢 M1 에서는 급하지 않습니다 — 짚어 주신 것에 동의합니다

*"우리 DB 에는 다 남아 있다"* 가 맞고, **M1·M2 에는 Kafka 가 없어서** 이벤트는 Outbox 에 쌓이기만 합니다(제가 올린 `NoOpEventPublisher` 가 그것입니다). **실제 분석 영향은 M3 부터**입니다.

그래서 지금 할 일은 **목록 고정과 발행 지점 결정까지**이고, 실패 통계를 실제로 보는 것은 M3 입니다.

---

# 3. 이벤트 목록이 문서 두 곳에서 다릅니다 — 정본을 정해 주십시오

| 문서 | 목록 |
|---|---|
| API 명세 3.1 | **12종** |
| S15P21E201-542 8.1 | M1 필수 5종 — 그중 **4종이 위 목록에 없음** |

없는 넷: `recommendation_requested` · `preference_set` · `constraint_set` · `trip_created`

**합집합 16종 + `recommendation_failed` = 17종**으로 고정하겠습니다. `requiredForM1()` 로 M1 필수를 갈라 뒀습니다. 이견 있으면 12:00 전에 말씀해 주십시오.

---

# 4. `common` 선점 풀었습니다

`backend/src/main/java/com/gabolle/backend/common` 을 release 했습니다. MR 이 막혀 있었다면 풀립니다. `event`·`itinerary`·`trip` 은 계속 잡고 있습니다.

🔴 그 안의 `common/config/TimeConfig.java`(Clock 빈 하나, `Clock.systemUTC()` 뿐)는 제가 `-352` 에 커밋했습니다. **공동 소유라 확인이 필요하고, 반대하시면 `event` 안으로 옮기겠습니다.**

— 모진성
