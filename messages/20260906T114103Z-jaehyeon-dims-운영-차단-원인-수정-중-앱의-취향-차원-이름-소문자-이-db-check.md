from: jaehyeon-dims
to: ahwlstjd57
at: 2026-09-06T11:41:03.253Z
subject: [운영 차단 원인·수정 중] 앱의 취향 차원 이름(소문자)이 DB CHECK 에 걸려 여행 생성이 전부 실패 — -665, TripController 먼저 손댑니다

모진성 님, 진미리 님. 실제 앱에서 여행 생성(`POST /api/v1/trips`)이 서버에서 전부 거부되고 있는 것을 찾았습니다. 티켓 S15P21E201-665 로 제가 고치고 있고, 모진성 님 파일(`TripController`)을 먼저 손대는 점 양해 부탁드립니다 — M1 줄기(가입→조건→추천→일정)의 세 번째 칸이 막혀 있어 기다리지 않았습니다.

## 무엇이 문제인가

앱(`frontend/src/api/tripApi.ts`)은 취향을 `preferences[]` 로 보내는데 `dimension` 이 소문자 camelCase 입니다 — `category, atmosphere, locality, quietness, touristPreference, foodPreference, transport, slopePreference, shadePreference`. 답 안 한 차원도 `answerStatus: "UNKNOWN"` 으로 항목은 갑니다.

서버는 `TripController.toCommand` 가 `dimension` 을 그대로 넘기고, `preference_answer.dimension` 칸의 CHECK(`ck_preference_answer_dimension`)는 **대문자 여덟 값만** 받습니다(`CATEGORY, ATMOSPHERE, LOCALITY, QUIETNESS, TOURIST_PREFERENCE, FOOD_PREFERENCE, SLOPE_PREFERENCE, SHADE_PREFERENCE`). `transport` 는 어느 표기로도 없습니다. 여행·참여자·제약·취향이 한 트랜잭션이라 취향 한 줄이 걸리면 **여행 자체가 롤백**되고 500 이 납니다.

로컬 DB 로 재현했습니다: `INSERT ... dimension='category'` → `violates check constraint "ck_preference_answer_dimension"`.

왜 안 잡혔나 — 여행 생성 테스트가 전부 대문자로 만들고, 앱이 실제로 보내는 모양으로 컨트롤러를 통과시키는 테스트가 하나도 없습니다. 그리고 배포 E2E 가 `X-User-Id`(-610) 와 배포 502(-663) 에 연달아 막혀 실 계정으로 여행 생성을 끝까지 눌러 본 사람이 없었습니다. 진미리 님이 -631 E2E 를 못 끝내신 진짜 이유가 이것일 가능성이 큽니다.

## 어떻게 고치나

서버에서 받습니다. 프론트는 안 고치셔도 됩니다.

- 컨트롤러에서 앱 이름 → DB 어휘로 정규화(`touristPreference` → `TOURIST_PREFERENCE` 등). 이미 대문자로 오면 그대로 통과. 모르는 이름은 400 (조용히 버리지 않습니다).
- `transport` 는 취향 스냅샷에 저장하지 않고 `trip.travel_modes` 로 갑니다(같은 시간에 진행 중인 S15P21E201-664 가 그 배선을 합니다 — `TRANSIT`→`BUS,SUBWAY`, `CAR`→`PRIVATE_CAR`, `WALK`→`WALK`).
- 앱이 보내는 본문 **그대로**를 컨트롤러에 넣어 201 이 나오고 `preference_answer` 에 8 행이 대문자로 저장되는 통합 테스트를 둡니다. 이것이 없어서 지금까지 안 잡혔습니다.

진미리 님께 확인 하나: `preferences[].value` 는 `JSON.stringify` 한 문자열(예 `"\"TRANSIT\""`, 배열은 `"[\"BEACH\",\"CAFE\"]"`)로 오는 것으로 보고 있습니다. 맞으면 답 안 주셔도 됩니다.

머지되면 다시 알리겠습니다. 그 뒤에 실 계정으로 여행 생성을 한 번 눌러 봐 주시면 -631 E2E 도 같이 닫힐 것 같습니다.
