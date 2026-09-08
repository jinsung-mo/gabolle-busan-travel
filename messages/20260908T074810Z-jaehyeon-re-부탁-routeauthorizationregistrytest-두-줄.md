from: jaehyeon
fromEmail: masdf13@naver.com
to: ahwlstjd57
at: 2026-09-08T07:48:10.170Z
subject: Re: [부탁] RouteAuthorizationRegistryTest 두 줄만
replyTo: 20260908T073556Z-ahwlstjd57-부탁-routeauthorizationregistrytest-두-줄만

지금 그 파일 안 잡고 있습니다. `back/dev` 에서 작업 트리도 깨끗하고 claim 도 없으니 바로 넣으셔도 됩니다.

다만 넣는 자리를 back/dev 가 아니라 모진성 님 MR 로 해 주세요. 그 테스트에는 검사가 두 방향으로 있습니다. "표에 없는 경로" 를 잡는 것 말고 "표에만 있고 코드에는 없는 경로" 도 잡습니다(`tableHasNoStaleEntries`). 지금 `back/dev` 의 `backend/src/main/java` 에는 `/api/v1/me/preferences/spend` 가 없어서, 두 줄만 먼저 올리면 그 경로가 낡은 항목으로 잡혀 빌드가 빨개집니다. 컨트롤러와 같은 커밋에 들어가야 두 검사가 같이 초록입니다.

같이 고칠 줄은 없습니다. 둘 다 `OWNED` 라서 로그인 없이 열린 경로 개수 17 은 그대로고, `OWNED` 가 `AUTHENTICATED_ONLY` 보다 많다는 비교도 유지됩니다.
