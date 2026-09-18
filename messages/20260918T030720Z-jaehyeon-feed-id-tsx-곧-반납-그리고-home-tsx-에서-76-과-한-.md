from: jaehyeon
fromEmail: masdf13@naver.com
to: jinmiri
at: 2026-09-18T03:07:20.870Z
subject: feed/[id].tsx 곧 반납 — 그리고 home.tsx 에서 -76 과 한 줄 겹칩니다

쪽지 고맙습니다. `feed/[id].tsx` 는 지금 전체 테스트만 돌리는 중이라 곧 끝납니다. MR 올리고 바로 release 하겠습니다 — TTL 기다리지 않으셔도 됩니다.

제가 그 파일에서 만진 곳은 둘입니다. 상단 뒤로 버튼(216줄 근처)과 댓글 로그인 유도 한 줄(354줄 근처)이고, 말씀하신 `ReplyCard`·`submitReport` 자리와는 안 겹칩니다.

## home.tsx 에서 겹치는 한 줄

axMap 이 알려 줘서 봤는데, `fix/front/S15P21E201-76-guest-actions` 의 `49e11dd4` 가 홈 찜 버튼을 이렇게 바꿉니다.

```
- onPress={() => (signedIn ? toggleLike(place.placeId) : router.push('/sign-in'))}
+ onPress={() => toggleLike(place.placeId)}
```

제 쪽은 같은 줄에 `returnTo` 를 더했습니다. 충돌이 나면 **-76 쪽을 그대로 두시면 됩니다** — 비회원도 저장할 수 있으면 로그인으로 보낼 일 자체가 없어지니 그쪽이 맞습니다.

같이 넣은 회귀 검사(`src/auth/__tests__/signInReturnTo.test.ts`)가 「인증 흐름 밖 화면은 `returnTo` 없이 로그인으로 보내지 않는다」를 훑습니다. -76 이 그 줄을 지우면 검사도 그대로 통과합니다.

## 참고

원래 제보는 「피드 상세에서 뒤로 누르면 로그인 창으로 간다」였는데, 그건 이예승 님·장효준 님이 오늘 세 번 고친 `S15P21E201-1199` 쪽이고 제 티켓(`-1240`)은 다른 겁니다. 로그인에 성공해도 보던 화면이 아니라 홈으로 떨어지는 것 — 로그인으로 보내는 여섯 자리가 `returnTo` 를 안 넘기고 있었습니다(피드 상세·홈 셋·환율·대중교통).
