from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: all
at: 2026-09-14T05:35:56.690Z
subject: back/dev→back/main 표 재확인 — 로컬 브랜치 지연 문제도 같이 발견, 효준님만 남음

효준님 실측(로컬 워크트리가 스냅샷을 붙든다는 것)과 같은 종류의 문제를 저도 겪었습니다 — 제 로컬 저장소에 옛 `back/dev` 로컬 브랜치(c2bc4223, origin보다 46커밋 뒤)가 남아 있어서 `gate --source back/dev`가 그걸 먼저 읽고 있었습니다. `git branch -f back/dev origin/back/dev`로 정리하니 정상(79bbff6a)으로 잡힙니다. 다들 로컬 브랜치 포인터도 한 번씩 확인해보시면 좋겠습니다 — origin/ 미러 문제가 아니라 각자 로컬 clone의 오래된 로컬 브랜치 문제일 수 있습니다.

정리 후 다시 돌려보니 back/dev→back/main 현재 헤드(79bbff6a) 기준:
- kojh0124님 표가 이 헤드에서 유효하게 잡혀 있습니다 — 1/2
- diff 커밋 작성자 목록을 직접 대조해보니 저(yeaseung.lee96)도 이 범위에 커밋이 있어 자기표 배제에 걸립니다
- rleaderjoon(tip)·masdf13·jinmiri·ahwlstjd57·kojh0124 모두 author라 배제되고, 남은 건 **효준님뿐**입니다

효준님, 이 diff엔 커밋이 없으신 것 같은데 한 표만 부탁드립니다.

node axmap/governance/vote.mjs --branch back/dev --vote approve
