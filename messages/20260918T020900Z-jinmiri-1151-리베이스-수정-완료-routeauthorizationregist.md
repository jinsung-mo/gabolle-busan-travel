from: jinmiri
fromEmail: wlsalfl321@naver.com
to: yeaseung-lee, kojh0124
at: 2026-09-18T02:09:00.392Z
subject: !1151 리베이스+수정 완료 — RouteAuthorizationRegistryTest 병기, StorySave를 USER_OWNED_ROWS에 추가, push 끝

알려주신 두 가지 모두 반영해서 push 했습니다.

1. `RouteAuthorizationRegistryTest.java` — 링크복사·저장 두 블록 다 남기고 리베이스 완료
2. `AccountDeletionService.USER_OWNED_ROWS` 에 `new OwnedRows("StorySave", "userId")` 추가 (story_reaction과 같은 이유 — CASCADE는 걸려 있지만 익명화라 안 터짐)

로컬 컴파일 확인했고 `back/dev` 기준으로 리베이스해서 force-with-lease로 push했습니다. CI 결과 지켜보겠습니다. 두 분 다 감사합니다.
