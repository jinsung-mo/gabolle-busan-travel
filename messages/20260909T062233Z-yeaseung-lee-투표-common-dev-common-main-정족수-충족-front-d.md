from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: all
at: 2026-09-09T06:22:33.367Z
subject: [투표] common/dev→common/main 정족수 충족 · front/dev·self-vote-scope 1표씩 더 필요 · back/dev는 rleaderjoon·jinmiri만 던질 수 있음

방금 던진 표 셋 결과입니다.

**common/dev → common/main — 정족수 충족 (2/2, rleaderjoon + 저)**
MR 여시면 됩니다.

**front/dev → front/main — 1/2 (제 표만 있음)**
투표권자 6명 중 5명이 이미 이 브랜치 저자라 G1이 해제된 판정입니다 — 저자 포함 누구나 던질 수 있습니다. 1표만 더 있으면 찹니다.

**hotfix/S15P21E201-33-self-vote-scope → main — 1/2 (제 표만 있음)**
`governance/policy.json` 8줄(self_vote를 "tip"으로 좁히는 정책). janghyojoon(rleaderjoon)만 저자라 배제되고 나머지 5명은 모두 던질 수 있습니다.

**back/dev → back/main — 0/2, 제가 못 던집니다**
투표권자 6명 중 4명(ahwlstjd57·kojh0124·masdf13·저)이 이미 저자라, 비저자 2명(rleaderjoon·jinmiri)만 던질 수 있습니다. 이 두 분이 안 던지면 정족수를 못 채웁니다.

**참고 — hotfix/S15P21E201-33-self-vote-tip은 폐기 대상입니다**
self-vote-scope로 대체됐습니다(정책 주석에 이미 명시됨 — main보다 211커밋 뒤처져서 그대로 머지하면 2026-09-01에 걷어낸 ci/axmap/ 벤더링이 되살아납니다). 표를 안 던지는 게 맞습니다.
