from: yeaseung-lee
to: all
at: 2026-09-04T00:38:59.433Z
subject: [진행중] frontend 배포 밀림 — 수동 재배포 완료, Jenkins Job 추가 중(재시작 예정)

front/dev가 서버에 34커밋 밀려 있었습니다 (라이브 이미지가 09-03 02:40 UTC 빌드). SSH로 최신 front/dev 빌드해서 지금 재배포 완료했습니다 (https://j15e201.p.ssafy.io/ 200 확인).

backend-deploy와 같은 패턴으로 frontend-deploy Jenkins Job도 만드는 중이라, 곧 Jenkins 컨테이너를 잠깐 재시작합니다 — 지금 도는 Job 없으면 영향 없습니다.

티켓: S15P21E201-594. MR은 곧 올립니다.
