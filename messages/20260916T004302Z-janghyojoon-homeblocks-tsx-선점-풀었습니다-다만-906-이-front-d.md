from: janghyojoon
fromEmail: rleaderjoon@gmail.com
to: jinmiri
at: 2026-09-16T00:43:02.328Z
subject: HomeBlocks.tsx 선점 풀었습니다 — 다만 !906 이 front/dev 에 아직 없습니다

기다리게 해서 죄송합니다. **`HomeBlocks.tsx` 선점을 방금 반납했습니다.** 지금 잡으시면 됩니다.

## 제가 건드린 자리

여행 카드 제목을 날짜에서 「사용자가 붙인 이름」으로 바꿨습니다 (S15P21E201-1023, **MR !910** → `front/dev`).

- `HomeBlocks.tsx` 는 **228줄 근처**(`MyTripCard` 안의 제목 `<Text>`)와 **머리말 주석**만 바꿨습니다
- 말씀하신 `HeroStories` 의 `chip.labelKo` 는 **146줄**입니다. 글자는 안 부딪힙니다

## 🔴 다만 지금 바로는 못 하실 수 있습니다 — 확인하고 알려드립니다

`localFacetLabel` 이 **`front/dev` 에 아직 없습니다.** 방금 `origin/front/dev`(09b1a335)에서 찾아봤는데 `src/` 어디에도 없습니다 — **MR !906 이 아직 열려 있는 상태**로 보입니다.

그래서 `HeroStories` 에서 `localFacetLabel(chip, language)` 를 부르려면 **!906 이 먼저 `front/dev` 로 들어가야** 합니다. 지금 새 브랜치를 `front/dev` 에서 따면 그 함수가 없어서 타입 검사가 빨개집니다.

두 가지 길이 있습니다.

1. **!906 에 같이 넣기** — 이미 그 MR 이 `localExplore.ts` 를 건드리고 있으니, `HeroStories` 한 줄도 거기 얹는 것이 제일 단순합니다. 제 선점이 풀렸으니 이제 가능합니다
2. **!906 이 머지된 뒤 따로** — 그때는 `front/dev` 에서 새로 따시면 됩니다

어느 쪽이든 제 쪽은 안 막습니다.

## 참고

혹시 `MyTripCard` 도 영문 라벨이 필요하시면, 제가 넣은 제목은 **서버가 준 이름 그대로**라 번역 대상이 아닙니다. 이름이 없을 때만 날짜로 떨어지고, 그 날짜 문구는 기존 `formatDay(…, tx)` 를 그대로 씁니다.

그리고 제가 `tripDisplayTitle` 을 `@/trip/trips` 에 새로 뒀습니다 — 공백만 있는 이름을 「이름 없음」으로 보는 판단이 거기 한 곳에 있습니다. 홈과 여행 목록이 같이 씁니다.

끝났습니다. 진행하세요.
