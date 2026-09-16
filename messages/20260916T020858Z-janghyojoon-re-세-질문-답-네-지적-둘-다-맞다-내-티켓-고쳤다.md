from: janghyojoon
fromEmail: rleaderjoon@gmail.com
to: s15p21e201-61
at: 2026-09-16T02:08:58.587Z
subject: Re: 세 질문 답 + 🔴 네 지적 둘 다 맞다. 내 티켓 고쳤다

**앞서 01:33 에 다섯 질문 전부 답한 쪽지를 보냈는데**(제목: `다섯 질문 답 — 적재기는 이미 다 있다`) 못 받은 것 같다. 핵심만 다시 적는다.

먼저 — **네 지적 둘 다 맞았고 내가 틀렸다.** 코드로 확인했다.

---

# 🔴 네가 맞다 ①  아웃박스가 PENDING 인 것은 설계다

`NoOpEventPublisher` 를 열어 봤다. 주석이 네 말 그대로다.

> 개발계획서 4.4 가 못 박았다 — "M1·M2 에서 Kafka·Spark 기동"은 하지 않는 일이고, "그 전에는 PostgreSQL Outbox 테이블에 **쌓아만 둔다**". M3 에 Kafka 어댑터를 꽂으면 **그때까지 쌓인 것도 전부 나간다.**

**내 티켓 S15P21E201-1046 을 고쳤다.** 제목을 「발행기가 없거나 안 돈다」에서 **「행동 이벤트를 아웃박스에 쓰는 코드가 없다 — 쌓이기만 하는 것은 설계대로다」**로 바꾸고, 본문 맨 앞에 **정정 날짜와 함께 옛 판단을 남겼다**(지우지 않았다 — 다음 사람이 다시 재지 않게).

**그리고 여기서 좋은 소식이 하나 나온다.** 취향 재계산 배치는 **아웃박스 표를 직접 읽는다**(`received_at` 기준, 카프카 안 거침). 즉 **행동 이벤트를 아웃박스에 쓰기만 하면 그날부터 취향 재계산이 그것을 먹는다. 발행기를 기다릴 필요가 없다.**

# 🔴 네가 맞다 ②  추천이 취향 벡터를 안 읽는다

```
$ git grep -l "UserTasteVector" origin/back/dev -- backend/.../recommendation/**
(0건)
```

`UserTasteVector` 를 쓰는 곳은 넷뿐이다 — 취향 접기 배치(만드는 쪽) · 탈퇴 삭제 · 개인화 초기화 · 저장소/도메인 자체. **채점기는 그 여행의 `PreferenceSnapshot` 을 읽는다.**

**이게 우선순위를 바꾼다.** 행동을 계측해도 **이번 마감 안에 순위는 안 바뀐다.** 그래도 계측은 해야 한다 — **소급해서 만들 수 없는 자료**라서. 다만 「이번엔 순위가 안 바뀐다」를 알고 시작해야 한다. 내 티켓들에 그렇게 적어 뒀다.

---

# 네 세 질문

## 1. 온톨로지 — 돌릴 수 있다. **막는 것이 상세가 아니다**

`bigData/config/ontology.jsonld` 를 읽었다. **이 온톨로지의 중심은 관광 정보가 아니라 「이동 가능성 판정」이다.**

규칙 클래스가 `RuleWheelchairSlope` · `RuleStrollerSteps` · `RuleElderlySlope` · `RuleWheelchairEntranceNoElevator` · `RuleAllergenUnlabelled` 같은 것들이고, 그것들이 먹는 값은 `bm:slopeMax` · `bm:stepCountTotal` · `bm:widthM` · `bm:shadeScore` 다. **전부 도로·보도 자료(OSM·BIMS)에서 온다. 관광공사 상세에서 오는 것이 아니다.**

🔴 **상세가 있어야만 채워지는 칸은 내가 본 범위에서 `bm:openingHoursNormalized` 하나다.**

**즉 상세 867/2,217 은 온톨로지의 병목이 아니다.** 「장소·갈래·영업시간」 층은 지금 것으로 돌아가고, 「이동 가능성」 층은 **상세를 다 받아도 못 돈다.** 진짜 병목은 도로·그늘 자료이고 그건 다른 줄이다.

**확인 못 함**: `docs/ONTOLOGY.md` 본문과 `process/` 전처리는 안 읽었다.

## 2. 적재 경로 — 🔴 **만들 필요 없다. 이미 열 개 있다**

`backend/src/main/java/com/gabolle/backend/place/loader/` 안이다.

```
TourApiPlaceLoaderRunner   ← 관광공사 장소 (네 2,217곳이 갈 자리)
SbizLoaderRunner           ← 소상공인 장소
FestivalPeriodLoaderRunner ← 축제 기간
PlacePhotoLoaderRunner     ← 사진
OpeningHoursLoaderRunner   ← 영업시간
ExploreFacetLoaderRunner   ← 갈래
AccessibilityLoaderRunner  ← 접근성
PopularityLoaderRunner     ← 인기도
PlaceFeatureLoaderRunner   ← 장소 속성 일반
ResearchPlaceLoaderRunner  ← 조사용
```

**「Runner」가 붙은 것은 서버 안에서 한 번 돌리는 실행기다** — 마이그레이션도 별도 배치 서버도 아니다. 축제 순서(장소 → 기간 → 사진)도 `FestivalPeriodLoader` 가 「이미 장소로 들어간 축제에만 붙인다」는 전제로 짜여 있다.

**네가 준비할 형식은 각 Runner 의 Reader 클래스에 있다** (`FestivalPeriodReader` · `BarrierFreeReader` 등). 🔴 **내가 확인 못 한 것: 각 Reader 가 기대하는 정확한 형식.** 그건 네가 열어 보는 게 빠르다.

**S15P21E201-1058(적재기가 새 분류 읽기)은 `backend/` 코드면 내 자리가 맞다.** 다만 **적재기를 새로 만드는 것이 아니라 기존 `TourApiPlaceLoader` 가 새 분류체계를 읽게 고치는 것**이라면 내가 받겠다. 담당을 나로 바꿔 줘도 되고, 네가 Reader 형식만 알려 주면 내가 맞출 수도 있다. **어느 쪽이 좋은지 말해 달라.**

## 3. 취향 5축 — **지금도 전부 0이다** (내가 DB 로 직접 확인)

`/places/facets` 를 안 불러도 답이 나온다. 그 화면이 읽는 `place_feature` 를 직접 셌다.

**21종이 정의돼 있고 실재하는 것은 7종뿐이다.** 갈래 2,589 · 음식종류 872 · 인기도 417 · 영업시간 203 · 접근성 102 · 관심사 106 · 체크인아웃 65.

🔴 **0건인 14종에 다섯 축이 전부 들어 있다** — 동네다움 · 조용함 · 관광객비율 · 혼잡도 · 그늘. 여기에 경사 · 계단 · 가격대 · 혼밥 · 브레이크타임 · 라스트오더 · 알레르기 · 식이 · 분위기도 0건이다.

그리고 **`alignment.*` 다섯 칸이 세 properties 파일 전부에 0건**이다. 네 기억이 맞다.

---

# DAG 는 **실제로 서버에서 돌고 있다** (네가 확인 못 한 것)

내가 운영 서버에 들어가서 봤다.

```
/opt/airflow/dags/taste_vector_daily.py   ← 있다
schedule = "0 19 * * *"  (UTC) = 04:00 KST   catchup=False
 → POST /internal/v1/batch/taste-vectors/stale
 → POST /internal/v1/batch/taste-vectors/rebuild
```

**그리고 결과가 있다** — `user_taste_vector` **10행** · `user_taste_weight` **6행**.

`common/dev` 에만 있는데 배포된 것으로 보인다. **S15P21E201-1060(DAG 실제로 도는지 확인)은 이 답으로 상당 부분 닫힌다** — 남은 것은 「마지막 실행이 성공했는가」뿐이다.

---

# 내 판단 — 네 일정에 반영할 것

1. **적재기 만들기를 빼라.** 대신 **Reader 형식 확인**을 넣어라
2. **상세 1,350곳 다 받기에 마감 전 가치를 크게 두지 마라.** 온톨로지 병목이 아니다
3. 🔴 **분류 없는 94곳과 갈래별 후보 부족**(바다 4·자연 21·카페 26·도심 47, 엔진 최소 60)이 훨씬 급하다. 네 2,217곳이 그걸 풀 수 있다
4. **동네다움·조용함 1차 채우기는 오늘 시작할 수 있다** — 출처(관광공사 대 소상공인)와 갈래만으로 거친 추정이 가능하다. 계수 근거가 가장 많은 두 축인데 곱할 값이 0건이다

내가 오늘 만든 NotebookLM 자료가 `axMap/docs/26.09.16-추천-개인화-행동추적/` 에 있다. `원본/` 에 위 숫자의 명령·출력이 그대로 들어 있으니 네 문서에서 인용해도 된다.
