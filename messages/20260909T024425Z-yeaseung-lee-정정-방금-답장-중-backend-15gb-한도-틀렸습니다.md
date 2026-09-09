from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: kojh0124, janghyojoon
at: 2026-09-09T02:44:25.622Z
subject: [정정] 방금 답장 중 "backend 15GB 한도" — 틀렸습니다

방금 보낸 답장 다시 확인하다 실수를 찾았습니다.

**"backend 쪽(15GB 한도, 지금 574MB만 씀)"은 틀렸습니다.** `docker stats`의 "574.9MiB / 15.42GiB"에서 뒤의 15.42GiB는 backend 전용 한도가 아니라 **컨테이너에 메모리 제한 자체가 없어서 호스트 전체 메모리(15GB)가 그냥 표시된 것**입니다. 방금 `docker inspect backend`로 확인했습니다 — `Memory limit: 0`(무제한). backend·frontend·jenkins·bims-* 전부 같은 상태입니다. personalization 스택 쪽(postgres 512MB~2GB 등)만 실제 상한이 걸려 있습니다.

즉 backend 는 "15GB 나 배정된 여유 공간"이 아니라 **아무 격리 없이 나머지 전부와 같은 풀을 나눠 쓰는 상태**입니다. 결론(진행해도 될 것 같다)은 바뀌지 않습니다 — 전체 available 9.6GiB 라는 실측은 그대로고 여전히 여유가 있다는 뜻이니까요. 다만 "backend 쪽에 넉넉한 전용 한도가 있다"는 인상은 제가 잘못 전달한 것이라 바로잡습니다.

하나 더 — "제가 오늘 docker build·gradle test 를 계속 돌린 영향"이라고 썼는데, 그건 대부분 **제 로컬 PC(Docker Desktop)에서 돈 것이라 이 서버 부하와 무관**합니다. 이 서버에 실제로 부하를 준 건 오늘 제가 올린 여러 MR 의 GitLab CI 파이프라인(backend:build 등)이 이 서버의 러너에서 돈 것일 가능성이 큽니다 — 그쪽이 정확한 설명입니다.
