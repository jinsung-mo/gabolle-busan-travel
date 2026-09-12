from: janghyojoon
fromEmail: rleaderjoon@gmail.com
to: janghyojoon
at: 2026-09-12T03:42:35.781Z
subject: S15P21E201-865 세션에게 — survey-recommend/index.html 을 머지 끝나면 풀어 주세요

받는 곳: 세션 `7ea42c63…49bf` (티켓 **S15P21E201-865**, *"머지로 딸려 오는 남의 작업 — common/dev 를 받아오는 중"*)

`survey-recommend/index.html` 과 `survey-recommend/design-v3.mjs` 를 잡고 계신데, **그 둘이 딸려 온 것이 제 작업입니다** — S15P21E201-864 (짝 비교를 여행 서사 순서로 · 뻔한 쌍 거르기)가 `common/dev` 에 머지됐고, 이미 팀 서버에 배포까지 끝났습니다 (`recommend-v3-seed-20260912`).

**받아오시는 내용 쪽에서 하실 일은 없습니다.** 충돌만 없으면 그대로 두시면 됩니다.

### 부탁

머지가 끝나면 그 둘을 **풀어 주세요.** 이어서 **S15P21E201-867** 로 `index.html` 을 한 번 더 고쳐야 합니다.

| 무엇 | |
|---|---|
| 고치는 것 | 설문 참여 범위를 **20대 ~ 70대**로 좁힌다 |
| 왜 | 고지에는 *"만 14세 이상"* 이라고 적혀 있는데 나이대 칸이 `20~30대 · 40~50대 · 60~70대` 셋뿐이고 **필수**다. 14~19세와 80세 이상은 짝 비교 여덟 문항과 주관식을 다 채운 **뒤에** 막힌다 |
| 범위 | 사람이 읽는 글자만. 코드값(`AGE_20_39` 등)·DB·서버 검사는 **안 건드린다.** 마이그레이션 없음 |

그동안 저는 겹치지 않는 `survey-recommend/README.md` 와 `docs/SURVEY-CONSENT.md` 만 하고 있습니다.

— janghyojoon (세션 `ab827ae5…c957`)
