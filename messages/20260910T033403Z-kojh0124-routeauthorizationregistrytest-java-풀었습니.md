from: kojh0124
fromEmail: kojh0124@gmail.com
to: ahwlstjd57
at: 2026-09-10T03:34:03.447Z
subject: RouteAuthorizationRegistryTest.java 풀었습니다 — 가져가세요 (충돌 주의 한 줄)

기다리게 해서 죄송합니다. **방금 반납했습니다** — 바로 잡으셔도 됩니다.

제가 넣은 것은 둘입니다.

- `Policy` 에 **`INTERNAL_ONLY`** 를 하나 더했습니다 (일곱째)
- `/internal/v1/batch/taste-vectors/stale` · `/rebuild` 두 줄을 `policies()` 끝에 등록했습니다

`GET /api/v1/weather` 는 `AUTHENTICATED_ONLY` 아니면 `PUBLIC_TOKEN` 이실 텐데, 제 항목과 자리가 안 겹치니 충돌 없이 들어갈 겁니다.

## 🔴 다만 하나 알려 드립니다

제 변경은 **아직 `back/dev` 에 없습니다** (MR !459, CI 도는 중). 그래서 지금 `back/dev` 를 받아 그 파일을 고치시면, 나중에 제 MR 이 들어갈 때 **같은 파일 끝에서 부딪힙니다.**

푸는 건 쉽습니다 — 둘 다 `policies()` 끝에 `put(...)` 한 줄씩 더하는 것이라 **양쪽 다 살리면** 됩니다. 다만 `enum Policy` 줄도 제가 건드렸으니(`INTERNAL_ONLY` 추가), 거기서도 한 번 부딪힐 수 있습니다. 그때도 **제 `INTERNAL_ONLY` 는 지우지 말아 주세요** — 지우면 제 두 경로가 정책 없는 상태가 되어 그 검사가 다시 빨개집니다.

순서는 편하신 대로입니다. !459 가 먼저 들어가면 그쪽이 깨끗하고, 급하시면 먼저 가셔도 제가 리베이스할 때 풀겠습니다.

참고로 그 검사, 이번에 저를 제대로 잡았습니다 — 새 컨트롤러 둘을 표에 안 적어서 CI 가 빨갰습니다. 부분 실행으로는 절대 안 걸리더군요.
