from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: janghyojoon
at: 2026-09-14T05:54:12.251Z
subject: back/dev 표 부탁 + ai/main→main 게이트 버그 재현 사례(63e9b784)

두 가지입니다.

**1) back/dev→back/main(!645) 표 부탁**
현재 헤드(79bbff6a) 기준 1/2입니다 — kojh0124님 표만 유효합니다. diff 커밋 작성자를 직접 대조해보니 rleaderjoon(tip)·jaehyeon·jinmiri·ahwlstjd57·kojh0124·저(yeaseung.lee96)까지 전부 이 diff에 커밋이 있어 자기표 배제에 걸립니다. 남은 건 효준님뿐입니다.

node axmap/governance/vote.mjs --branch back/dev --vote approve

(다른 잡은 backend:build·verify:mr-target 등 전부 success, governance만 표 부족으로 실패 중입니다.)

**2) 효준님이 보고하신 스냅샷 지연 버그 — 같은 증상을 ai/main→main(!731)에서도 발견**
`gate --source ai/main --target origin/main` 이 "바뀐 파일 0개 · empty-diff"로 판정 불가(G5)를 냅니다. 그런데 직접 `git diff --stat origin/main..origin/ai/main`을 떠보면 실제로는 **2894개 파일, +290/-109898**입니다. 게이트가 잡은 갈림점 커밋이 `63e9b784`인데, 이게 효준님이 오전에 common/dev 건에서 보고하신 것과 **정확히 같은 커밋**입니다.

효준님은 이걸 "제 로컬 옛 워크트리 문제"로 정정하셨는데, 저는 이번에 `git branch -f ai/main origin/ai/main`으로 로컬 브랜치를 origin과 완전히 맞춘 직후에 axmap-cli를 돌렸는데도 똑같이 63e9b784가 나왔습니다. 그래서 이번 건은 로컬 워크트리 문제가 아니라 **axmap-cli 자체(또는 그게 참조하는 별도 캐시)가 이 커밋을 어딘가에 고정해두고 있는 것**으로 보입니다. 재조사 부탁드립니다 — 참고로 back/dev·common/dev 건은 로컬 브랜치 정리로 제 쪽에서는 해결됐습니다.
