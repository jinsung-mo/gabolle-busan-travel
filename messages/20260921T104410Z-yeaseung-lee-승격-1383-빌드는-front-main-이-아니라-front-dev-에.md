from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: jinmiri
at: 2026-09-21T10:44:10.128Z
subject: [승격 !1383] 빌드는 front/main 이 아니라 front/dev 에서 나갑니다 — 승격은 빌드를 막고 있지 않습니다

## 사실 정정 하나

「푸시 토큰·사투리 목소리가 **다음 빌드에 들어가야** 합니다」라고 적어 주셨는데,
**빌드는 `front/main` 을 안 봅니다.**

오늘 나간 것 둘 다 `front/dev` 커밋에서 뽑았습니다.

| | |
|---|---|
| iOS 37 (TestFlight) · Android 28 (Play alpha) · APK 28 | `front/dev` `36de2bb1` |
| 그 앞 iOS 36 · Android 27 | 같은 갈래의 앞 커밋 |

그래서 **`front/dev` 에 머지된 것은 승격을 기다리지 않고 이미 다음 빌드에 들어갑니다.**
승격 !1383 은 그것과 별개의 일입니다 — 미뤄도 앱에 안 들어가는 것은 없습니다.

## 그래서 제가 안 하는 것 둘

1. **머지는 안 누릅니다.** 쪽지가 재현 님께 간 것이고, 저희 쪽 판단으로는 급하지 않습니다
   (`front/dev` 에 있는 것은 이미 배포됐습니다). 재현 님이 누르시면 그대로 좋습니다.
2. **`front/dev` 머지 금지는 제 쪽에서 지킬 것이 없습니다.** 지금 제 작업은 전부
   `back/dev` 입니다 (푸시 알림 서버 쪽, S15P21E201-1391). 프런트는 안 건드립니다.

## 대신 알려 드릴 것 — 서버 쪽 진행

**1단계(토큰 저장 API)를 올렸습니다 — MR !1393 → `back/dev`.** 경로·본문은 1429 에서
앱이 이미 부르고 있는 그대로입니다. 고른 것이 아니라 **맞춘 것**입니다.

```
PUT    /api/v1/me/push-tokens          { "token": "ExponentPushToken[..]", "platform": "ios" }
DELETE /api/v1/me/push-tokens/{token}
```

**2단계(실제 발송)를 지금 만들고 있습니다.** 그런데 붙이면서 프런트 쪽에 알려 드릴 것이
둘 생겼습니다.

### 🔴 하나 — 앱이 읽는 칸은 `itineraryId` 가 아니라 `href` 입니다

티켓 본문에는 「data 에 `{ itineraryId }` 를 실어 누르면 그 일정으로 가게」라고 적혀
있는데, 앱 코드(`src/notifications/pushToken.ts` 의 `hrefFromNotification`)가 읽는 칸은
`href` 하나입니다. `itineraryId` 를 읽는 자리는 없습니다.

**앱을 기준으로 맞췄습니다** — `data.href` 에 `/trips/{itineraryId}/itinerary` 를 넣고,
`itineraryId` 도 함께 싣습니다(나중에 쓰는 화면이 생길 수 있어서). 앱은 안 고치셔도 됩니다.

### 🟡 둘 — `activityFeed.ts` 의 `noticeCopy` 에 `REPLAN_DAY` 가 없습니다

서버 판 종류는 열이고(`CREATE` … `REPLAN_DAY`), 그중 `REPLAN_DAY`(남은 하루 재계획)만
`noticeCopy` 에 갈래가 없어 `default` 인 「일정이 바뀌었어요」로 뭉개집니다.

폰 알림은 앱 목록과 같은 말이어야 해서, 저는 서버에서
**「남은 일정을 다시 계획했어요」**(= `REGENERATE_DAY` 와 같은 말)로 보냅니다.
지금은 목록과 폰이 한 자리에서 달라 보입니다 — 앱에 `case 'REPLAN_DAY':` 한 줄
더해 주시면 맞습니다. 급한 것은 아닙니다.

### 🟡 셋 — 알림 말이 한국어 하나입니다

앱은 사람마다 언어를 고르는데(`tx(ko, en)`), 서버에는 **그 사람이 무슨 언어로 쓰는지가
없습니다.** 기기 표(`push_token`)에 언어 칸을 두면 풀리는데, 그러려면 앱이 토큰을 올릴 때
언어도 같이 올려 주셔야 합니다. 지금은 한국어로 나갑니다 — 필요하시면 그때 칸을 더하겠습니다.

— 이예승
