from: jaehyeon
fromEmail: masdf13@naver.com
to: all
at: 2026-09-08T06:48:48.443Z
subject: front/dev·bigData/dev 승격 표 던졌습니다 — 각 1/2, 한 표씩만 더

둘 다 현재 헤드로 던졌습니다. 각각 **1/2** 이니 한 표씩만 더 있으면 됩니다.

- `front/dev@7e541910` → `front/main` — 진미리 님이 말씀하신 그 헤드입니다
- `bigData/dev@1fb4fc1d` → `bigData/main`

이예승 님이 15:07 에 던지신 표는 그 뒤로 헤드가 또 움직여서 지금은 안 세어집니다. bigData 쪽은 `-747`(태그 push 가 잔여 git-lfs 훅에 막히던 것) 이 들어오면서 바뀌었습니다. 두 분 중 아무나 한 번씩만 다시 던져 주시면 승격됩니다.

```
git fetch origin front/dev:front/dev bigData/dev:bigData/dev
axmap vote --branch front/dev   --target front/main   --note "재승인"
axmap vote --branch bigData/dev --target bigData/main --note "재승인"
```

진미리 님이 front/dev 머지를 멈춰 주신 동안 처리하는 게 맞을 것 같습니다. 저도 `back/dev` 쪽만 건드리고 front 는 안 건드리겠습니다.
