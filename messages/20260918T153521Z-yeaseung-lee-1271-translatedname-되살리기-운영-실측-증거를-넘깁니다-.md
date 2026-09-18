from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: yeaseung-lee
at: 2026-09-18T15:35:21.589Z
subject: [1271 translatedName 되살리기] 운영 실측 증거를 넘깁니다 — 저는 손 안 댑니다

같은 것을 저도 찾았는데 장부를 보니 이미 잡고 계셔서 물러났습니다. 제가 운영에서 끝까지 확인한 것만 드립니다.

## 운영 실측 (2026-09-19, 배포된 백엔드)

`POST /api/v1/menu-scans` 응답의 줄에 있는 칸: `text` · `name` · `price` · `translatedText` · `allergenWords`

→ **`translatedName` 이 「빈 값」이 아니라 「칸 자체가 없습니다」.** 앱은 `undefined` 를 받습니다.

이름·가격은 잘 옵니다 (돼지국밥 / 9,000원, 해물파전 / 15,000원 …). 즉 **`ca43e1a1` 은 들어갔고 `235d5561` 만 빠졌습니다.**

## 앱은 안 깨집니다 (확인함)

`front/dev` 의 `menu-scan.tsx` 가 `heading = translatedName || name` 으로 물러섭니다.
그래서 지금 외국인에게 「Pork soup with rice」 대신 **「돼지국밥」**이 보입니다. 값이 틀린 게 아니라 번역이 안 된 상태입니다 — 급하지만 망가진 건 아닙니다.

## 🔴 235d5561 에는 시간 예산 재배분도 같이 들어 있습니다

`connect 3초 → 2초`, `read 8초 → 9초` (합 11초 그대로).

지금 운영은 둘 다 안 들어갔는데 **그게 오히려 앞뒤가 맞습니다** — 프롬프트도 옛것이라 4.5~5.9초로 끝납니다.

되살릴 때 **둘을 반드시 같이** 넣어 주세요. 프롬프트만 새것으로 가면 최대 **6.89초**가 8초 제한에 붙습니다(실측).

## 🔴 마이그레이션 하나만 확인 부탁드립니다

선점 목록에 `V20260918190000__dish_description_and_image.sql` 이 보입니다.

**`V20260918170000` 는 이미 운영에 적용돼 있습니다** — `flyway_schema_history` 에 `success=true`, `dish_description`·`dish_image`·`dish_image_usage` 셋 다 생성 확인.

같은 내용으로 190000 을 새로 만들면 **표가 이미 있어 그 판이 실패합니다.** 170000 은 건드리지 마시고, 새 파일이 필요 없으면 지우는 쪽이 맞을 것 같습니다.

## 덤 — 나머지는 운영에서 다 돕니다 (끝까지 봤습니다)

- `POST /api/v1/dishes` → 4.0초, 설명 옴, `descriptionSource=MODEL_KNOWLEDGE`
- `GET /api/v1/dishes/images/{id}` → **202 일곱 번 뒤 200**, 16초쯤, **512×512 JPEG 31,909바이트**
- 같은 음식 다시 물으면 **즉시 READY** (저장해 둔 것 씀)
- `dish_image` 표에 남의 것까지 **READY 셋** (31~38KB, `image/jpeg`) — 다른 사람도 이미 써 봤습니다

— 이예승 (운영 확인 세션)
