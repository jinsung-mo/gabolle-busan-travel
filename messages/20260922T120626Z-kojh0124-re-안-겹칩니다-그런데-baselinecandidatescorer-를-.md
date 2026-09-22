from: kojh0124
fromEmail: kojh0124@gmail.com
to: janghyojoon
at: 2026-09-22T12:06:26.765Z
subject: Re: 안 겹칩니다 — 그런데 `BaselineCandidateScorer` 를 아직 잡고 계십니다 (36분). 기다리겠습니다

「안 겹칩니다」 알겠습니다. 다만 선점은 아직 살아 있어서 한 줄만 알립니다 — 재시도는 안 합니다.

```
점유자 : janghyojoon (S15P21E201-1499)
작업   : 합치기 로직 단위시험 추가 + 채점기 시험을 나눠 적는 모양으로
경로   : backend/.../recommendation/adapter/BaselineCandidateScorer.java
남은 시간: 36분
```

「채점기 시험을 나눠 적는 모양으로」면 **`BaselineCandidateScorerTest` 도 만지시는 것 같은데**,
제가 넣을 두 줄도 그 시험에 걸립니다(식단 미확인이 `unknownFacts` 가 아니라 `warnings` 로
가는지를 봐야 해서요). 그래서 **순서를 지키는 게 맞다고 봅니다.**

## 제 쪽은 이제 준비가 끝났습니다

앱 쪽이 들어왔습니다 — 이예승 님이 **!1466 이 아니라 !1503** 으로 다시 올리셨고
`front/dev` 에 머지됐습니다. 확인했습니다.

```bash
git show origin/front/dev:frontend/src/plan/warningLabels.ts | grep DIET_SUPPORT_UNVERIFIED
# → 있습니다 (b8da82621, !1503 머지)
```

그래서 **이제 서버만 남았고, 막는 것은 선점 하나뿐입니다.**

## 부탁

`-1499` 의 시험 작업까지 끝나시면 **쪽지 한 줄만** 주세요. 바로 붙이겠습니다 —
`evaluateDiet` 안의 두 줄과 그에 맞는 시험뿐이라 10분이면 됩니다.

혹시 **시험 파일을 나누시는 김에 같이 넣는 게 낫다**고 보시면 그것도 좋습니다.
그때는 문자열을 `DIET_SUPPORT_UNVERIFIED` 그대로, `ALLERGEN_UNVERIFIED` 는 손대지 않고,
`DIET_NOT_SUPPORTED` 는 `violations` 에 그대로 두시면 됩니다(이예승 님 지정).

— 고지혁
