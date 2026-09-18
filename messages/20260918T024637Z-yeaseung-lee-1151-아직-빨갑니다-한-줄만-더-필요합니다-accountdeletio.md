from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: jinmiri
at: 2026-09-18T02:46:37.206Z
subject: !1151 아직 빨갑니다 — 한 줄만 더 필요합니다. AccountDeletionTableInventoryTest 의 목록입니다

리베이스 고맙습니다. 충돌은 풀렸고 `can_be_merged` 인데 **`backend:build` 가 빨갑니다.** 파이프라인 `205287`, 실패는 **한 건**입니다.

```
AccountDeletionTableInventoryTest > 🔴 app_user 를 가리키는 표 목록이 그대로다 FAILED
  🔴 app_user 를 가리키는 표가 새로 생겼습니다: [story_save]
  Expecting empty but was: ["story_save"]
  at AccountDeletionTableInventoryTest.java:105
```

2146건 중 1건 실패입니다. 나머지 잡(`claims`·`verify:jira-key`·`verify:mr-target`·`mr:gates`·`backend:migration-order`·`backend:dependency-scan`)은 **전부 초록**입니다.

## 무엇을 더 해야 하나

**`AccountDeletionService.USER_OWNED_ROWS` 에 넣으신 것과는 다른 파일입니다.** 그건 「탈퇴할 때 지운다」는 **행동**이고, 이 시험이 요구하는 건 「그 결정을 했다」는 **기록**입니다. 둘이 따로 있습니다.

```
backend/src/test/java/com/gabolle/backend/auth/AccountDeletionTableInventoryTest.java
  → TABLES_POINTING_AT_APP_USER 에 story_save 한 줄 추가
```

시험이 직접 안내하는 셋 중 미리 님은 이미 **(가) AccountDeletionService 에서 지운다**를 고르셨으니, 남은 건 그 목록에 줄 하나 더하는 것뿐입니다. 시험 메시지에도 이렇게 적혀 있습니다 — *"목록에 더하는 것 자체는 아무것도 지우지 않습니다. 그건 (가) 를 골랐을 때 AccountDeletionService 를 고쳐야 하는 별개의 일입니다."*

즉 **행동은 이미 하셨고, 목록만 비어 있습니다.**

## 왜 이런 시험이 있나

새 표가 사람을 가리키면 **탈퇴 때 어떻게 할지 누군가 정해야 하는데, 안 정하면 그냥 남습니다.** 그게 남으면 「탈퇴했는데 내 글이 남아 있다」가 됩니다. 사람이 매번 기억할 수 없으니 표가 늘어나는 순간 CI 가 막아 세우도록 해 둔 것입니다. **미리 님이 뭘 잘못하신 게 아니라, 절차가 한 칸 남은 것입니다.**

한 줄 넣고 push 하시면 통과합니다. 마이그레이션 번호는 이미 확인됐습니다(`20260918130000` > `20260918120000`).

**손이 모자라시면 말씀 주세요 — 시험 파일 한 줄이라 제가 넣어도 위험이 없습니다.** 다만 남의 브랜치라 먼저 안 건드렸습니다.

## 그리고 `S15P21E201-1237` 번호가 겹쳤습니다

미리 님 메뉴판 프론트 카드 번호로 **`S15P21E201-1237`** 이 만들어졌고 **`!1163` 이 그걸 쓰고 있습니다 — 그건 맞습니다.**

그런데 **`!1162`**(마이페이지 프로필 카드·하루 비용 합계)도 커밋 제목에 **같은 `1237`** 을 쓰고 있습니다. 그쪽은 전혀 다른 작업이라, 머지되면 **미리 님 카드가 엉뚱하게 움직입니다.** 제가 그쪽을 막아 두고 정리하겠습니다 — 미리 님은 `1163` 그대로 진행하시면 됩니다.
