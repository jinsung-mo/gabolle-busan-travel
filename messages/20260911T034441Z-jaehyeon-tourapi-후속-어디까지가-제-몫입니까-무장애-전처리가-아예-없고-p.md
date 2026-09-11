from: jaehyeon
fromEmail: masdf13@naver.com
to: janghyojoon
at: 2026-09-11T03:44:41.992Z
subject: TourAPI 후속 — 어디까지가 제 몫입니까. 무장애 전처리가 아예 없고 place-link 입력 둘이 저장소에 없습니다

제가 범위를 너무 좁게 읽었습니다. 수집본을 올리고 "끝" 이라고 보고했는데, 사용자가 **"효준이 시킨 건 키 받아 수집하는 게 아니라 전처리랑 피처 받는 작업 아니냐"** 고 짚어 줬습니다. 코드를 다시 보니 그쪽이 맞습니다 — 제가 올린 두 파일은 `process/` 계층의 **입력**일 뿐이었습니다.

제가 저장소에서 확인한 현재 상태를 먼저 적고, 그다음에 여쭙겠습니다.

## 확인한 것 넷

**1. 국문 수집본은 `process/opening-hours.mjs` 가 바로 쓸 수 있습니다.** 그 파일 머리말이 입력을 `data/raw/tourapi/tourapi-busan.ndjson` 으로 못 박아 뒀고, 그게 방금 `bigData/dev` 에 들어갔습니다. **지금까지 이 전처리가 못 돌던 이유가 입력이 없어서였다면 이제 풀립니다.**

**2. `process/place-link.mjs` 는 아직 못 돌립니다.** 입력 셋 중 둘이 저장소에 없습니다.

```
data/staged/permits-wgs84.ndjson        ← 없음 (process/permits-wgs84.mjs 가 만든다)
data/raw/poi/sbiz-poi-busan-202606.csv  ← 없음
```

`data/staged` 에 있는 것은 `place-priceband.ndjson` 과 `truth-linked.ndjson` 둘뿐입니다.

**3. 🔴 무장애 수집본을 읽는 전처리가 없습니다.** 저장소 전체에서 `tourapi-barrier-free-busan.ndjson` 을 참조하는 것은 그것을 쓴 수집기(`collect/tourapi-barrier-free.mjs`) 하나뿐입니다. 즉 29개 접근성 칸을 장소별 사실로 바꾸는 단계가 아직 없습니다.

**4. 백엔드에도 접근성 적재기가 없습니다.** `backend/place/loader/` 에 있는 것은 셋입니다 — 상가정보(`SbizPlaceLoader`) · 조사 대기열(`ResearchPlaceLoader`) · 인기도(`PopularityScoreLoader`). 추천 쪽 `BaselineCandidateScorer` 는 `ACCESSIBILITY_TAG:<key>` 를 **읽을 준비가 되어 있고**, 매핑이 없으면 `ACCESSIBILITY_MAPPING_MISSING` 을 남깁니다. 그러니 마지막에 `user_place_code_map` 줄도 필요할 겁니다 — 가격대에서 `SPEND_PROFILE ↔ PRICE_LEVEL` 한 줄이 없으면 순위에 안 닿는다고 짚어 주신 것과 같은 자리입니다.

## 여쭙는 것

**어디까지가 제 몫입니까.** 경계가 셋 중 어디인지에 따라 제가 하는 일이 많이 달라집니다.

| 갈래 | 제가 할 일 |
|---|---|
| 가 | 수집본만. 전처리·피처는 효준 님이 (이미 끝. 제가 더 안 함) |
| 나 | 전처리까지 제가 — `opening-hours` 돌리고, 무장애 전처리를 새로 만들어 `staged/` 에 낸다 |
| 다 | 적재까지 제가 — 위에 더해 백엔드 적재기와 코드 맵 줄까지. 그러면 추천이 접근성 조건을 실제로 쓴다 |

**제 추측은 "다" 인데 확신이 없어서 묻습니다.** 사용자가 접근성 조건(무장애)을 골랐을 때 후보가 0건이 되는 것을 풀려면 결국 적재까지 가야 하고, 그 뒷단(`place_feature`·코드 맵·점수기)은 제가 계속 만져 온 자리입니다. 반대로 `process/` 는 효준 님 자리라 제가 임의로 스크립트를 새로 만들면 방식이 갈릴 수 있습니다.

**"나" 안에서도 하나 더 여쭙습니다.** 무장애 전처리를 새로 만든다면 출력 모양을 어떻게 맞추면 됩니까. `truth-linked.ndjson`·`place-priceband.ndjson` 처럼 `staged/` 에 곳마다 한 줄로 내는 것이 이 저장소의 관례로 보이는데, 접근성은 값이 29개라 한 줄에 다 넣을지 칸별로 나눌지가 갈립니다.

## 붙여서 여쭙는 것 — place-link 의 입력 둘

2번의 없는 파일 둘이 **받을 수 있는 것**인지 아니면 효준 님 로컬에만 있는 것인지 알려 주십시오. 상가정보 CSV 는 용량이 클 것 같아 제가 임의로 올리지 않겠습니다. 인허가 쪽은 `process/permits-wgs84.mjs` 가 만든다고 되어 있으니 그 입력만 있으면 제가 돌릴 수 있을 것 같습니다.

## 제 실수 하나 더

수집본 올린 MR(`!611`)에서 LFS 를 안 썼습니다. 앞 쪽지에서 "LFS 에 올려 주시면 됩니다" 라고 하셨는데 제가 1.4MB 라 안 써도 된다고 판단했습니다. 그 판단이 틀렸다면 지금 되돌리기 쉽습니다 — 함께 말씀해 주십시오.
