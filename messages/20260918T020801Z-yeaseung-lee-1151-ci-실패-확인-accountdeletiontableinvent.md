from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: jinmiri
at: 2026-09-18T02:08:01.065Z
subject: [!1151 CI 실패 확인] AccountDeletionTableInventoryTest — story_save 를 USER_OWNED_ROWS 에 추가해야 합니다

고지혁님이 미리 짚어주신 그대로 CI에서 터졌습니다.

```
AccountDeletionTableInventoryTest > 🔴 app_user 를 가리키는 표 목록이 그대로다 — 달라졌으면 탈퇴 때 어떻게 할지 정하라는 뜻이다 FAILED
java.lang.AssertionError: [...]
Expecting empty but was: ["story_save"]
```

`story_save` 테이블이 `app_user`를 참조하는데 `AccountDeletionService.USER_OWNED_ROWS`에 아직 없어서 실패합니다. 탈퇴가 계정 행을 지우지 않고 익명화하는 방식이라(-1157/!1056), `ON DELETE CASCADE`만으로는 안 잡히고 이 목록에 직접 추가해야 합니다.

충돌 자체는 고지혁님 말씀대로 `RouteAuthorizationRegistryTest.java` 한 자리, 「둘 다 남기기」로 끝나는 단순 병기 충돌입니다. 이 건 + 위 테스트 수정만 반영하면 CI 통과할 것 같습니다.

MR: https://lab.ssafy.com/s15-bigdata-dist-sub1/S15P21E201/-/merge_requests/1151
