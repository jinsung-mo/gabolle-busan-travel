from: jaehyeon
fromEmail: masdf13@naver.com
to: janghyojoon
at: 2026-09-17T02:17:32.321Z
subject: 탈퇴 시 삭제 항목과 잔존 항목 실측 — CASCADE 로 정리된다고 믿던 표가 안 지워집니다

운영에서 제 구글 계정으로 글 작성부터 탈퇴까지 밟고 DB 를 세 번 세었습니다. **지워질 것으로 알고 있던 표 둘이 그대로 남습니다.**

## 즉시 하드 삭제 — 확인됨

| 표 | 전 → 후 |
|---|---|
| `auth_identity` · `auth_session` | 1 · 8 → 0 · 0 |
| `user_consent` | 1 → 0 |
| `trip` (소유) | 2 → 0 |
| `story_image` | 2 → 0 |
| `uploaded_image` | 3 → 0 (저장소 파일까지, 정리 대기열 0건) |

## 남기되 비우는 것 — 설계대로

| 표 | 상태 |
|---|---|
| `app_user` | 행 유지 · `status=DELETED` · 표시명 「탈퇴한 사용자」 · 아바타와 출발지 라벨 비움 |
| `story` | 행 유지 · `deleted_at` 만 찍힘. 본문·`place_id`·`visibility=PUBLIC` 은 그대로 |

## 안 지워지는 것 — 여기가 문제입니다

| 표 | 전 → 후 |
|---|---|
| `saved_place` | 1 → **1** |
| `menu_scan_usage` | 10 → **10** |

## 원인

`AccountDeletionService` 가 `app_user` 행을 **지우지 않고 익명화**합니다. `itinerary_versions.created_by` 가 NOT NULL 로 매달려 있어 계정 행을 지우면 남의 일정 편집 이력까지 지워야 하니, 그 결정 자체는 맞습니다.

그런데 그 결과로 **`app_user` 를 가리키는 외래키 29개 중 `ON DELETE CASCADE` 로 걸린 것들이 한 번도 발동하지 않습니다.** 서비스가 JPQL 로 이름을 적어 지우는 22개 표만 지워지고, CASCADE 에만 기대던 표는 아무도 안 지웁니다. 오류도 안 나고 삭제는 성공으로 끝납니다.

같은 구조라 자료만 있으면 똑같이 남을 표: `collection` · `place_review` · `user_follow` · `user_block` · `place_visit_verification`.

## 부탁

이 뒤를 어느 방향으로 잡을지가 효준님 판단이 필요한 자리라 먼저 드립니다.

새 표를 만드는 사람은 `ON DELETE CASCADE` 를 달면 탈퇴 정리가 끝났다고 믿게 되는데, 그 믿음을 깨는 자리가 코드에도 문서에도 없습니다. 제 생각에는 `pg_constraint` 에서 `app_user` 참조 외래키를 뽑아 삭제 서비스가 다루는 목록과 대조하는 CI 검사 하나면 재발이 막힙니다. 빠진 두 표를 지우는 것보다 그쪽이 본체 같습니다.

관련해서 약관 제8조와 처리방침 3절이 「탈퇴 기능이 아직 앱에 없다」로 남아 있던 것과 「지체 없이 파기」가 실제보다 강한 약속이던 것은 오늘 MR !1040 으로 정정해 `front/dev` 에 머지했습니다. 문서가 실제보다 강하게 말하는 상태만 먼저 끊었고 코드는 안 건드렸습니다.

확인 경계 — 운영 DB 읽기 전용 조회 세 번과 스키마 외래키 목록이 근거입니다. 코드 수정이나 시험은 이 건에서 돌리지 않았습니다.
