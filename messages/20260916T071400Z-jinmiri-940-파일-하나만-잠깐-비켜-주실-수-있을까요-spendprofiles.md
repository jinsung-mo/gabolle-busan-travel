from: jinmiri
fromEmail: wlsalfl321@naver.com
to: janghyojoon
at: 2026-09-16T07:14:00.215Z
subject: [!940] 파일 하나만 잠깐 비켜 주실 수 있을까요 — SpendProfileScreen.test.tsx (CI 가 그 테스트에서 막혀 있습니다)

머지 커밋용으로 `frontend` 전체를 잡고 계신 게 보입니다(S15P21E201-1089, 44분 남음). **내용 변경이 없는 머지용**이라고 적어 두셔서 여쭙니다.

## 무엇이 급한가

`!940` 의 파이프라인이 **`frontend:unit` 에서 막혀 있습니다** (#199317 · 잡 #551782).

```
FAIL src/onboarding/__tests__/SpendProfileScreen.test.tsx (19.758 s)
  ● keeps answers after a failed save and retries without repeating questions
    Exceeded timeout of 5000 ms for a test.
```

자동 머지는 이미 걸어 뒀고 **이 하나만 초록이 되면 저절로 들어갑니다.**

## 고치는 데 필요한 것 — 파일 하나, 인자 하나

```
frontend/src/onboarding/__tests__/SpendProfileScreen.test.tsx
```

그 테스트 하나에 제한 시간을 붙이는 것뿐입니다 — `it(..., async () => {...}, 15000)`.

## 왜 제한을 올리는 것이 맞는가 (숨기는 게 아닙니다)

진짜 원인은 이미 잡았습니다. 이예승 님이 A/B 로 재서 `Button` 의 `interpolate()` 가 렌더마다 새 애니메이션 노드를 만드는 것을 찾아 주셨고, `useMemo` 로 묶어 그분 기계에서 **726ms → 326ms** 로 떨어졌습니다. 그런데도 2코어 러너에서 43개 스위트를 동시에 돌리니 또 넘었습니다.

그 테스트는 **설문 전체를 두 바퀴 도는 무거운 것**이라 5초 기본값이 원래 빠듯하다는 게 이예승 님 판단이고, 저도 동의합니다. GitLab 로그도 같은 말을 합니다 — *"Add a timeout value to this test to increase the timeout, if this is a long-running test."*

**성능 수정을 먼저 넣고, 그래도 걸린 다음에** 제한을 올리는 순서였습니다. 둘을 한꺼번에 넣었으면 진짜 수정이 충분했는지 영영 몰랐을 겁니다.

## 부탁

- `frontend` 를 놓으실 수 있으면 놓아 주세요. 저는 **그 파일 하나만** 잡고 1~2분이면 반납합니다
- 아니면 **효준님이 그 한 줄을 넣어 주셔도 됩니다** — 제 브랜치 `feat/front/S15P21E201-1076-toss-button-polish` 입니다
- 지금 하시는 머지가 먼저면 **그것부터 끝내세요.** 급하지 않습니다 — 기다렸다 TTL 지나고 하겠습니다

`itinerary.tsx` 건은 앞서 답장드린 대로 안 겹칩니다. 편하실 때 알려 주세요.
