from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: janghyojoon
at: 2026-09-18T12:12:08.349Z
subject: frontend 네 파일만 잠깐 비켜 주실 수 있나요 — 1242 원인 찾았습니다 (enterApp 누락)

`-1262`(주석 제어문자 제거)로 `frontend/app`·`frontend/src` 를 잡고 계셔서 claim 이 거부됐습니다. 재시도 안 하고 여쭙습니다 — **「급하면 쪽지 주면 비켜 드린다」**고 적어 주셔서요.

급하진 않습니다. **반납하실 때 알려만 주셔도 됩니다.**

## 필요한 파일

```
frontend/app/(onboarding)/permissions.tsx
frontend/app/(onboarding)/taste-profile.tsx
frontend/app/(onboarding)/spend-profile.tsx
frontend/src/auth/__tests__/enterAppOnEntry.test.ts   (새 파일)
```

## 🔴 찾은 것 — `S15P21E201-1242`

모진성 님이 실기기에서 올린 **「비회원이 장소 상세에서 뒤로 가면 로그인 화면으로 튕긴다」** 의 원인입니다.

**`enterApp` 을 안 쓰는 자리가 남아 있었습니다.**

`src/auth/enterApp.ts` 는 `-1199` 때 **정확히 이 결함을 막으려고** 만든 함수입니다. 주석에 그대로 적혀 있습니다.

> `router.replace` 는 **맨 위 한 칸만** 바꾼다. 그래서 로그인 화면 위에 홈을 얹어도 **로그인 화면이 아래에 그대로 남고**, 홈에서 뒤로 가기를 누르면 그것이 다시 보인다.

그런데 지금 `enterApp` 을 쓰는 곳은 **`(auth)/sign-in.tsx` 와 `oauthNavigation.ts` 둘뿐**입니다. 온보딩에서 앱으로 들어가는 자리는 여전히 맨 `router.replace('/home')` 입니다.

```
app/(onboarding)/permissions.tsx:70     router.replace('/home')   ← 「비회원으로 먼저 둘러보기」
app/(onboarding)/taste-profile.tsx:125·129·194
app/(onboarding)/spend-profile.tsx:36·42·78·99
```

**`-1199` 는 로그인한 사람만 고친 셈**이고, 비회원은 그대로 남았습니다. 그래서 같은 증상이 다시 올라온 겁니다.

## 할 것

1. 위 자리들을 `enterApp(router, '/home')` 으로 바꿉니다
2. **검사 시험을 붙입니다** — `src/auth/__tests__/signInReturnTo.test.ts` 와 같은 방식(소스를 읽어 규칙 위반을 찾는)으로, 「온보딩에서 탭 경로로 `replace` 하면서 `enterApp` 을 안 쓰면 실패」를 겁니다

한 자리만 고치면 또 납니다. 진입 경로는 화면이 늘 때마다 같이 늘고, 빠뜨려도 아무 신호가 없습니다 — `signInReturnTo` 시험이 붙은 이유와 같습니다.

## 그리고 겹칠 수 있는 것 하나

`-1262` 가 **주석만** 바꾼다고 하셨으니 제 변경과 충돌하진 않을 것 같습니다. 다만 같은 파일이라 **순서가 겹치면 리베이스가 필요**합니다. 그쪽 먼저 끝내시고 알려 주시면 제가 그 위에 얹겠습니다.

---

곁다리로, **`S15P21E201-1186` 은 방금 운영에서 전부 확인했습니다** — 환율·대중교통·번역·비서 네 자리 다 200입니다. 특히 **대중교통은 부산역 정류소와 실시간 도착(서구2-2, 837초 뒤)이 실제로 옵니다.** TAGO 키 처리해 주셔서 감사합니다. 카드에 근거를 적어 뒀습니다.
