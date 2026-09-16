from: jinmiri
fromEmail: wlsalfl321@naver.com
to: all
at: 2026-09-16T21:56:50.517Z
subject: 🔴 실측 보고 — 취향 축 9개 중 6개가 0곳, /recommendations/now 는 서버에 없음

배포 서버(j15e201)를 익명 세션으로 직접 찔러 본 실측입니다 (2026-09-17). 추측 아닙니다.

## 🔴 1. 취향 축 9개 중 6개가 **0곳**입니다

`GET /api/v1/places/facets` 실측:

| userInputCode | placeCount |
|---|---|
| CATEGORY | 2694 🟢 |
| FOOD_PREFERENCE | 873 🟢 |
| EXPLORE | 106 🟢 |
| **ATMOSPHERE** | **0** 🔴 |
| **LOCALITY** | **0** 🔴 |
| **QUIETNESS** | **0** 🔴 |
| **SHADE_PREFERENCE** | **0** 🔴 |
| **SLOPE_PREFERENCE** | **0** 🔴 |
| **TOURIST_PREFERENCE** | **0** 🔴 |

**비어 있는 여섯이 하필 우리 앱의 차별점입니다.** 그늘·경사·조용함·로컬·관광객 비율 —
「초개인화」라고 부르는 축이 전부 0이고, 실제로 도는 것은 카테고리·음식·탐색 셋뿐입니다.
사용자가 「조용한 곳」·「그늘 많은 길」을 고르면 아무것도 안 나옵니다.

### 계산하는 코드는 이미 있습니다

`bigData/process/` 에 `slope.mjs` · `shade.mjs` · `shadow.mjs` · `vista.mjs` ·
`subway-access.mjs` · `calibrate-slope.mjs` 가 다 있습니다. **산출물이 서비스 DB 의
`place_feature` 로 안 들어간 것**으로 보입니다 (`bigData/data/` 에 결과 파일이 없습니다).

🔴 **저는 이걸 지어낼 수 없습니다.** 점수를 임의로 채우면 「모르는 것을 아는 척」이 되고,
그건 이 팀이 가장 하지 말자고 한 것입니다. 파이프라인을 돌려 본 적 있는 분이 필요합니다.

**여쭙습니다 — 이 여섯 축, 목요일까지 채울 수 있나요? 못 채우면 화면에서 빼는 게
맞습니다.** 고를 수는 있는데 결과가 0인 선택지가 제일 나쁩니다.

## 🔴 2. `POST /api/v1/recommendations/now` 가 **404** 입니다

`app/now.tsx`(지금 갈 곳)가 부르는 경로가 배포 서버에 없습니다. 변형 다섯 개 전부 404:
`/recommendations/now`(GET·POST) · `/recommendations` · `/now-recommendations` ·
`/recommendation-jobs`.

더 나쁜 건, 프론트가 404 를 받으면 **샘플 데이터로 대체**합니다
(`nowRecommendations.ts:99` → `buildSampleNowResult`). 가짜 장소를 진짜처럼 보여줍니다.

다만 `/now` 화면은 **아무 데서도 링크가 없어서**(고아) 지금 사용자는 못 들어갑니다.
→ 백엔드에 만들 계획이 있나요? 없으면 화면과 샘플 폴백을 지우는 게 맞습니다.

## 3. `GET /api/v1/festivals` 가 **items=0**

축제 데이터가 비어 있습니다. `/festivals` 화면도 링크가 없는 고아이고, 비면 샘플로
대체합니다(`isSample: true`). EXPLORE 갈래에는 FESTIVAL 14곳이 있으니 데이터가 아예
없는 건 아닙니다 — 두 경로가 다른 곳을 보고 있는 것 같습니다.

## 4. 숙소·호텔은 축 자체가 없습니다

「호텔/비행기/숙박 링크 연결」이 목표에 있는데 `place_feature` 에 숙소 갈래가 없습니다.

## 🟢 잘 도는 것 (실측)

- `/places?query=감천문화마을` → 1건 🟢
- `/places/nearby` → 20건 · `/places/categories` → FOOD 2197 외 6갈래 🟢
- `/stories` → 3건 🟢 · `/weather` → 200 🟢 · `/origins` → 8건 🟢
- `/places/{id}/taxi-card` → 200 🟢

## 오늘 제가 한 것

- !1018 주변 버스 도착 (머지됨)
- !1019 서버 배너가 화면 제목 덮던 것 (머지됨)
- !1022 앱 네이티브 지도 — 폰에는 지도가 아예 없었습니다
- !1024 택시 카드가 어디를 가든 흰여울문화마을이던 것

**1번과 2번은 제가 혼자 못 끝냅니다. 답 주시면 그에 맞춰 화면을 정리하겠습니다.**
