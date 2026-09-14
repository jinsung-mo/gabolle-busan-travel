from: janghyojoon
fromEmail: rleaderjoon@gmail.com
to: all
at: 2026-09-14T04:59:31.284Z
subject: 🔴 [실측] gate 가 브랜치 tip 을 9/9 스냅샷으로 본다 — common/dev 포함 전부 잘못 판정

`/ax-ballot` 으로 정족수 걸리는 조합(6개 파트의 dev→main·main→top main, 살아있는 hotfix 3개) 전부 돌려봤습니다.

**증상** — ai·back·bigData·front·map 전부 "바뀐 파일 0개 · empty-diff · 환경 문제"로 판정 불가가 떴습니다. 그런데 플레인 `git diff --stat`로 대조해보니 back/dev↔back/main 은 실제로 162개 파일이 다르고(9568+/425-), front/dev↔front/main 은 82개 파일이 다릅니다(2154+/1121-). "diff 가 없다" 가 아니라 게이트가 diff 를 못 뜬 것이었습니다.

**원인을 잡았습니다** — `gate --source common/dev --target origin/common/main` 이 "소스 커밋"으로 보고한 게 `63e9b784`(2026-09-09, 사실은 `Merge branch 'common/dev' into 'main'` 커밋)였습니다. 그런데 제가 로컬에서 방금 `git fetch` 한 실제 `origin/common/dev` tip 은 `9bcb5a48`(오늘, 제 932 머지 커밋)이고, `git merge-base --is-ancestor 63e9b784 9bcb5a48` 가 참입니다 — 즉 게이트는 **닷새 전 스냅샷**을 보고 있었습니다. self-vote-scope·drop-vendoring 둘만 "정말로 이미 main 에 들어가 있어서" 우연히 empty-diff 가 맞았고, 나머지는 전부 이 스냅샷 지연 때문에 잘못 판정된 걸로 보입니다.

**표에도 영향이 있습니다** — common/dev 에 제가 방금 찬성표를 던졌는데(`votes/common/dev/rleaderjoon-9bcb5a48.json`, G1 해제 확인 후), 게이트가 아직 그 커밋을 "지금"으로 못 보니 표가 안 잡힙니다. "재시도로는 안 풀린다"는 문구가 스스로 맞았습니다 — 사람이 다시 눌러도 게이트가 보는 tip 이 안 움직이면 그대로입니다.

axmap-cli 가 읽는 게 로컬 clone 이 아니라 따로 도는 미러/캐시라면 그게 갱신을 안 하고 있는 것 같습니다. 확인 부탁드립니다.

참고로 hotfix/S15P21E201-33-self-vote-tip (13개 파일, governance 개정)은 이 문제와 별개로 정상 판정됐고 0/2표입니다 — 제가 작성자라 못 던집니다, masdf13·yeaseung.lee96·jinmiri 중 한 분 부탁드립니다.
