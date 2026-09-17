from: janghyojoon
fromEmail: rleaderjoon@gmail.com
to: jaehyeon
at: 2026-09-17T02:27:34.702Z
subject: 탈퇴 삭제 — `anonymizeForDeletion` 을 지금 손대고 계신가요? 겹치기 전에 여쭙니다

재현님, 탈퇴 실측 쪽지 잘 받았습니다. **`AccountDeletionService` 를 지금 직접 건드리고 계신다고 들어서, 겹치기 전에 먼저 여쭙니다.**

## 여쭙는 것 — 셋

1. **`AccountDeletionService.anonymizeForDeletion` 을 지금 고치고 계신가요?** 브랜치가 이미 있으면 알려 주십시오
2. 고치신다면 **어디까지**인가요 — ⑴ 빠진 표를 지우는 코드만 ⑵ 계정 행을 진짜로 지우는 데까지(마이그레이션 포함) ⑶ 제안하신 CI 대조 검사
3. **나머지를 저희가 맡아도 될까요?** 겹치는 파일만 피하면 병렬로 갑니다

## 저희가 잰 것 — 넘겨 드립니다. 재시지 마십시오

재현님이 잰 둘에서 **열하나까지** 늘었습니다. `S15P21E201-1157` 에 목록이 있습니다.

```
app_user 를 가리키는 외래키 34개
  ON DELETE CASCADE  20   ← 계정 행을 안 지우니 한 번도 안 터진다
  규칙 없음          12
  SET NULL            2
```

**실측 잔존** `saved_place`(1→1) · `menu_scan_usage`(10→10)
**구조가 같아 자료만 생기면 남을 것** `collection` · `place_review` · `place_visit_verification` · `user_follow` · `user_block` · `trip_invite` · `trip_share_link` · `oauth_signup_ticket` · `recommendation_place_action`

🔴 **어제 29개였던 것이 오늘 34개입니다. 그 증가 자체가 이 건의 증상입니다** — 그래서 *「`pg_constraint` 에서 뽑아 삭제 서비스 목록과 대조하는 CI 검사가 본체」* 라는 재현님 판단에 저희도 동의합니다. 손으로 센 목록은 또 낡습니다.

## 🟢 그리고 막고 있던 전제가 이미 풀렸습니다

*「계정 행을 지우면 남의 일정 편집 이력까지 지워진다」* 던 것 — **그걸 견디는 코드가 이미 `back/dev` 에 있습니다** (`8abc6f44`, `S15P21E201-1095`, 판 이력 작성자가 비어도 견딘다).

남은 건 마이그레이션 세 줄입니다.

```sql
ALTER TABLE itinerary_versions ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE itinerary_versions DROP CONSTRAINT fk_itinerary_version_created_by;
ALTER TABLE itinerary_versions ADD  CONSTRAINT fk_itinerary_version_created_by
    FOREIGN KEY (created_by) REFERENCES app_user (user_id) ON DELETE SET NULL;
```

2026-09-07 주석에 팀이 이미 고른 방식 그대로입니다 — *「여행에 매달린 것은 CASCADE, 사람을 가리키는 보조 칸은 SET NULL」*.

🔴 **다만 이것만으로는 안 끝납니다.** 계정 행을 하드 삭제하려면 **「규칙 없음」 12개 중 넷**이 더 막습니다 — `itinerary_excluded_place` · `story_coauthor` · `story_invite` · `story`.

## 순서에 대한 의견 차이 하나

저희 쪽 판단은 **「검사보다 삭제를 먼저」** 입니다. 검사는 훌륭하지만 **아무것도 지우지 않고**, 지금 빌드를 심사에 올리는 중이라 **자료가 남는 상태가 그만큼 더 갑니다**(애플 5.1.1(v)). 검사는 작아서 같은 날 뒤에 붙일 수 있다고 봅니다.

**재현님 생각은 어떠신가요?** 이미 손대고 계신 범위에 맞춰 저희가 비켜 가겠습니다 — **답 주실 때까지 `AccountDeletionService` 와 그 마이그레이션은 안 건드리겠습니다.**

약관·처리방침을 MR !1040 으로 먼저 정정하신 것 — **문서가 실제보다 강하게 말하는 상태를 먼저 끊은 것**이 순서가 맞았습니다.
