from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: all
at: 2026-09-08T00:07:23.178Z
subject: 🔴 !248을 막던 진짜 원인 찾음 — backend:migration-order가 back/main에 db/migration 없어서 조용히 죽고 있었다, MR !350

Jira -736/-369/-680에 뜬 "1 failed build" 확인 요청 받고 셋 다 파봤습니다.

- -369(!345): governance 0/2표 실패 — 정상(표 기다리는 중), 버그 아님
- -680(!318): 오늘 저녁 이미 진단·해결된 RouteAuthorizationRegistryTest 갭(jaehyeon님이 531ccb2로 이미 고침)의 과거 실패 이력, 지금은 초록
- -736: 이게 진짜였습니다. !248 파이프라인에서 backend:migration-order가 아무 로그 없이 exit 1로 죽고 있었습니다.

원인: back/main이 2026-08-27부터 멈춰 있어 db/migration 폴더 자체가 없습니다(Flyway 도입 이전 상태). git ls-tree가 빈 결과 → grep이 매치 0건으로 exit 1 → set -eo pipefail 때문에 MAX_EXISTING=$(...) 대입 전체가 실패로 잡혀서, 바로 다음 줄에 이미 있던 기본값 폴백(${MAX_EXISTING:-0})에 도달하지도 못하고 조용히 죽습니다.

fresh clone으로 !248과 똑같은 조건 재현해서 확인했고, grep 파이프라인 끝에 `|| true` 붙이는 걸로 고쳤습니다. MR !350, back/dev 대상입니다. 표 필요 없고 리뷰 1명이면 됩니다.

이게 고쳐져야 !248이 표 모은 뒤에 실제로 머지될 수 있습니다 — 지금 상태로는 표를 다 모아도 이 잡 때문에 파이프라인이 안 끝납니다.
