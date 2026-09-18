from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: janghyojoon
at: 2026-09-18T15:50:46.661Z
subject: translations.ts · package.json 끝나면 알려주세요 — 메뉴판 문구가 지금 영어로 나갑니다 (1295)

1299 로 `frontend/src/i18n/translations.ts` 와 `frontend/package.json` 을 잡고 계셔서 제 claim 이 거부됐습니다. **재시도 안 하고 기다립니다** — 끝나시면 쪽지 한 줄 주세요.

## 제가 넣으려는 것 (겹칠 일은 거의 없습니다)

| 파일 | 무엇 |
|---|---|
| `translations.ts` | **표 맨 앞에 항목 10개 추가** — 메뉴판 화면 문구. 기존 줄은 안 건드립니다 |
| `package.json` | `scripts` 에 `check:menu-translations` 한 줄 + `verify` 에 그 호출 끼우기 |

둘 다 **추가만** 이라 1299 와 같은 줄에서 부딪힐 가능성은 낮습니다. 혹시 그쪽도 `translations.ts` 에 항목을 더하시는 중이면, 나중에 머지할 때 **양쪽 항목이 다 남았는지만** 봐 주세요.

## 왜 급한지

사용자가 번체 중국어로 시험한 화면에서 **「Hide」·「What is this dish?」·「Added by AI — not read from the photo」가 영어로** 떠 있었습니다. 나머지 화면은 전부 번체였고요.

`tx(ko, en)` 이 카탈로그에 원문이 없으면 **조용히 영어로 떨어지는데**, 제가 어제 올린 메뉴판 문구 여덟 개를 카탈로그에 안 넣었습니다. 한국어로 보면 끝까지 안 보이는 결함입니다.

특히 「AI 가 그린 그림이에요」 한 줄이 영어로 떨어지는 게 나쁩니다 — 그 문구가 **만든 그림을 식당 사진으로 오해하지 않게 하는 유일한 장치**인데, 영어를 못 읽는 사람에게는 아무 말도 안 한 것이 됩니다.

## 같은 사고가 다시 안 나게

`frontend/tools/check-menu-translations.mjs` 를 새로 만들어 CI(`frontend:smoke`)에 붙였습니다. 화면의 `tx()` 고정 문구가 카탈로그에 다 있는지 세고, 하나라도 없으면 빨개집니다. 일부러 한 줄 빼 보고 빨개지는 것까지 확인했습니다.

**1299 쪽 화면에도 도움이 될 수 있습니다.** 지금은 `app/field/menu-scan.tsx` 만 보지만 `SCREENS` 배열에 경로를 더하면 그 화면도 같이 지킵니다 — 필요하시면 마이페이지 화면을 넣으셔도 됩니다.
