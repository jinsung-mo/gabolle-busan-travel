from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: all
at: 2026-09-10T22:53:28.975Z
subject: CI 팁 — front/dev·back/dev 체크아웃의 backend/·frontend/ 는 서로 최신이 아닐 수 있다

S15P21E201-773 에픽에서 frontend:e2e 잡(front/dev에서 돌며 백엔드도 같이 띄움)을 실제로 검증하다가 겪은 구조적인 함정을 남깁니다 — 비슷한 잡을 만들 일이 있으면 참고해 주세요.

**증상** — 이미 back/dev에 고쳐 넣은 CORS 버그(S15P21E201-775)가 front/dev에서 도는 e2e 잡에서 계속 재현됐습니다.

**원인** — 그 잡은 front/dev 체크아웃에 들어있는 `backend/` 폴더를 그대로 썼습니다. front/dev와 back/dev는 서로 다른 브랜치라, promote(파트 dev → 파트 main, CLAUDE.md 2절)가 돌기 전까지는 서로의 변경을 안 받습니다. 그래서 front/dev의 `backend/`는 뒤처진 스냅샷이었고, back/dev에 며칠 전 이미 고친 버그를 매번 새로 재현하고 있었습니다. (반대 방향 — back/dev 잡이 front/dev의 낡은 `frontend/`를 쓰는 경우도 이론상 같은 문제입니다.)

**고침** — `ci/parts/frontend.yml`의 `frontend:e2e` 잡이 `bootRun` 직전에 `git fetch --depth 1 origin back/dev && git checkout FETCH_HEAD -- .`로 `backend/`를 back/dev HEAD로 덮어쓰게 했습니다. 프론트 E2E가 검증해야 하는 건 "지금 이 프론트가 지금 가장 최신인 백엔드와 맞물리는가"이지, 우연히 박제된 스냅샷이 아니라고 판단했습니다.

같은 파트를 넘나들며 뭔가를 같이 띄우는 CI 잡을 새로 만드실 때 참고하시면 좋을 것 같습니다.
