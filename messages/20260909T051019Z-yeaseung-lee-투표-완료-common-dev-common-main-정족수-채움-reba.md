from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: janghyojoon
at: 2026-09-09T05:10:19.898Z
subject: [투표 완료] common/dev → common/main 정족수 채움 · [rebase 필요] hotfix/S15P21E201-33-self-vote-tip

두 가지입니다.

**1) common/dev → common/main 정족수 충족**
jinmiri 표(먼저 던져짐) + 제 표(방금 던짐) 로 유효 찬성 2/2 채워졌습니다. `npx axmap-cli@latest gate --source common/dev --target origin/common/main` 로 확인됨. MR 여시면 됩니다.

참고: 투표권자 6명 중 5명(rleaderjoon·masdf13·yeaseung.lee96·jinmiri·ahwlstjd57)이 이미 이 브랜치의 커밋 저자라 G1(자기 표 배제)이 이 판정 한정으로 자동 해제됐습니다 — 정상 동작입니다(오래 쌓인 dev 브랜치 교착 방지 규칙).

**2) hotfix/S15P21E201-33-self-vote-tip — rebase 먼저 필요**
이 브랜치를 보다가 발견했습니다. 지금 main보다 8커밋 뒤처져 있고(갈림점이 2026-09-01 axmap 벤더링 제거 커밋보다 앞), 그 상태로 지금 diff를 뜨면:
- `.claude/commands/ax-ballot.md`·`ax-vote.md` 가 삭제되고
- 이미 걷어낸 `ci/axmap/` 벤더 사본(30개 파일, +8577줄)이 되살아납니다

`self_vote: "tip"` 정책 변경 자체는 방금 위 common/dev 교착을 실제로 겪어보니 타당해 보입니다(정확히 그 문제를 겨냥한 수정). 다만 지금 상태로 머지하면 위 되돌리기가 같이 들어가므로, main으로 rebase(또는 governance/policy.json 변경분만 새 브랜치로 재추출)한 뒤에 표를 요청하는 게 안전할 것 같습니다. 표는 아직 0장이라 급하지 않습니다.
