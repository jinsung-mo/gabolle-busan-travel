from: janghyojoon
fromEmail: rleaderjoon@gmail.com
to: db, 이예승, 박재현
at: 2026-09-16T08:38:22.934Z
subject: db/migration 에 한 장 넣었습니다 — itinerary_leg.fare_krw (MR !979)

데이터 세션 자리라 먼저 알립니다. **선점은 이미 반납했습니다.**

## 넣은 파일

`backend/src/main/resources/db/migration/V20260916180000__itinerary_leg_fare.sql`

```sql
ALTER TABLE itinerary_leg ADD COLUMN fare_krw INTEGER;
ALTER TABLE itinerary_leg ADD CONSTRAINT ck_itinerary_leg_fare_krw
    CHECK (fare_krw IS NULL OR fare_krw >= 0);
```

MR !979 (`feat/back/S15P21E201-1109-leg-fare` → `back/dev`), 티켓 S15P21E201-1109.

## 왜

일정 화면의 **「예상 비용」이 출처 없는 숫자**였습니다. 운영에서 직접 재 보니
`itinerary_item.estimated_cost_krw` 는 **411개 전부 NULL** 이고 그 칸을 채우는 코드가
저장소에 없습니다. 그런데 화면에는 금액이 찍힙니다.

그러면서 **진짜 요금은 받아 놓고 버리고 있었습니다.** `KakaoMobilityRouteAdapter` 가
카카오모빌리티 응답에서 택시 요금·통행료를 이미 파싱해 `RouteLeg` 에 담는데, 거기서
끊겨 아무도 안 읽습니다. 그 사슬을 DB 까지 이었습니다.

## 두 가지만 봐 주시면 됩니다

**1. `itinerary_item` 이 아니라 `itinerary_leg` 에 붙였습니다.**
요금은 "A→B 로 가는 데 드는 돈" 이라 구간의 성질이고, 입장료는 "그 장소에 들어가는 돈"
이라 장소의 성질입니다. 한 칸에 합치면 입장료 자료가 없는 지금 **「교통비만 낸 합계」가
「총비용」으로 읽힙니다.**

**2. 기존 행은 NULL 로 둡니다.** 이 기능 이전에 만들어진 구간이라 요금을 알 수 없고,
모르는 것을 0 으로 적는 것은 주장입니다 —
`V20260908220000__itinerary_leg_data_status.sql` 이 같은 이유로 같은 선택을 했습니다.
같은 이유로 도보·대중교통 구간도 0 이 아니라 비웁니다. 0 을 넣으면 화면이 전부
**「무료」**로 그립니다.

## 앞으로 이 칸에 들어올 것

지금 값이 들어가는 것은 **자동차 계열(택시·자가용·렌터카)뿐**입니다 — 카카오모빌리티가
자동차 경로만 주기 때문입니다.

**대중교통 운임은 별건입니다.** 노선망이 들어오면 탄 노선·구간·환승 횟수로 계산할 수
있고, S15P21E201-1104 (MR !973, RAPTOR 탐색)의 결과가 그 셋을 이미 압니다. 그래서
**`bims-route-stops.mjs` 실행 여부**가 이것과도 이어집니다 — 앞서 여쭌 그대로입니다.

— 장효준 세션
