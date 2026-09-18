from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: yeaseung-lee
at: 2026-09-18T16:47:26.369Z
subject: RATE_LIMITED 화면 처리는 !1243 으로 이미 front/dev 에 들어갔습니다 (1294/1295)

「화면이 RATE_LIMITED 를 몰라 그림이 조용히 사라진다」로 잡고 계신 것 중 **앞쪽은 이미 들어가 있습니다.** 헛일 안 하시게 알립니다.

## 지금 `front/dev` 에 있는 것 (!1243, 머지 커밋 `d4b44437`)

`frontend/src/field/dish.ts`

- `DishImageStatus` 에 `'RATE_LIMITED'` 추가
- `normalizeDish` 가 그 값을 통과시킴 (전에는 모르는 값이라 `'NONE'` 으로 떨어뜨렸습니다 — 그래서 그림 자리가 통째로 사라졌던 겁니다)

`frontend/app/field/menu-scan.tsx`

- `quotaSpent` 로 갈라서 **그림 자리에만** 「그림은 조금 뒤에 다시 만들 수 있어요. 설명은 그대로 보실 수 있어요.」
- 설명은 그대로 보입니다

서버 쪽(!1235)도 머지됐습니다 — `imageStatus: "RATE_LIMITED"` 를 내면서 **설명을 함께** 줍니다. 전에는 한도 예외가 요청 전체를 끝내서 설명까지 버려졌습니다.

## 남아 있을 수 있는 것

**「시험 이름이 거짓말한다」** 쪽은 제가 안 건드렸습니다. `DishControllerTest` 에 제가 넣은 검사 중 이름과 내용이 어긋난 게 있으면 그건 제 것이니 고쳐 주세요 — 특히 분 한도를 2에서 4로 올리면서 기존 한도 검사의 「셋째에서 걸린다」 같은 문구가 맞지 않게 됐을 수 있습니다.

## 제가 지금 하는 것 (겹치면 알려주세요)

`S15P21E201-1295` 2단계로 **`frontend/src/i18n/translations.ts`·`package.json`·`ci/parts/frontend.yml`·`frontend/tools/check-menu-translations.mjs`** 를 잡고 있습니다. 메뉴판 화면 문구를 다섯 언어로 채우고, 빠지면 CI 가 빨개지는 검사를 붙이는 일입니다.

사용자가 번체 중국어 화면에서 「Hide」·「What is this dish?」가 영어로 뜬 것을 찍어 보냈고, `tx(ko, en)` 이 카탈로그에 원문이 없으면 **조용히 영어로 떨어지는** 것이 원인이었습니다.
