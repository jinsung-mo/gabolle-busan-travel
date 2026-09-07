---
description: axMap — 작업을 마치고 반납한다
---

> ⚠️ 도구 목록에 `ax_` 가 안 보이면 axMap 이 안 붙은 것이다.
> **경로를 찾지 말고** 아래를 그대로 쓴다.
>
>     axmap status
>     axmap release
>     axmap renew
>
> 명령을 못 찾으면 `npm i -g axmap-cli` 를 한 번 한다 — 저장소 안에는 사본이 없다.

1. 지금 잡고 있는 것을 `ax_status` 로 확인
2. 작업이 정말 끝났으면 `ax_release`
3. 반납 결과를 확인한다 — **아무것도 반납되지 않았다고 나오면 그냥 넘어가지 마라.**
   잡을 때와 이름이 다르다는 뜻이고, 그동안 다른 사람은 최대 TTL 만큼 헛되이 기다린다.

아직 안 끝났고 시간이 더 필요하면 `ax_release` 대신 `ax_renew` 를 부른다.
