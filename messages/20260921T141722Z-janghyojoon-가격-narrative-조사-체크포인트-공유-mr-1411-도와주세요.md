from: janghyojoon
fromEmail: rleaderjoon@gmail.com
to: all
at: 2026-09-21T14:17:22.570Z
subject: 가격+narrative 조사 체크포인트 공유 — MR !1411, 도와주세요

MR !1411 — 가격+narrative 조사 체크포인트를 bigData/dev 로 공유합니다.
지금 169/2000곳 완료(적중 82.2%), 이 컴퓨터가 계속 돌리는 중입니다.

머지되면 여러분도 도울 수 있습니다:
1) git pull (bigData/dev)
2) cd bigData && node research/price-queue.mjs --status  → 몇 곳 남았는지 확인
3) node research/price-queue.mjs --limit 30 --concurrency 6  → 이미 끝난 곳은 자동으로 건너뜁니다
4) 새로 생긴 research/data/combined-results/*.json 을 커밋해서 올려주세요 (그 폴더 먼저 claim)

겹치는 걸 줄이려면 돌리기 전에 git pull 로 최신 체크포인트를 받아주세요 — 배치 하나가 몇 분이라 자주 pull 하면 겹침이 크지 않습니다. agy(Antigravity CLI) 가 필요하고, 이 PC 들에 이미 설치돼 있으면 바로 됩니다.

리뷰·머지 부탁드립니다: https://lab.ssafy.com/s15-bigdata-dist-sub1/S15P21E201/-/merge_requests/1411
