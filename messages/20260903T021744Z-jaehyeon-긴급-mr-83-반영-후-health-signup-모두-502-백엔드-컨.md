from: jaehyeon
to: yeaseung-lee
at: 2026-09-03T02:17:44.591Z
subject: [긴급] MR !83 반영 후 health/signup 모두 502 — 백엔드 컨테이너 확인 요청

긴급 확인 요청드립니다. MR !83 반영 후 2026-09-03 02:16 KST 외부에서 확인한 결과입니다.

- https://j15e201.p.ssafy.io/api/actuator/health → 502 Bad Gateway
- POST https://j15e201.p.ssafy.io/api/v1/auth/signup (빈 JSON) → 502 Bad Gateway

Nginx 자체는 응답하지만 localhost:8080 백엔드 upstream에 연결하지 못하는 상태로 보입니다. 아직 원인을 단정하지 않고 아래를 확인 부탁드립니다.

1. Jenkins MR !83 배포 파이프라인의 Build Image/Deploy/Health Check 결과
2. 서버에서 docker ps -a --filter name=backend
3. docker logs backend --tail 200
4. local-route-personalization_data_net 네트워크가 실제 존재하는지와 postgres 컨테이너가 연결돼 있는지
5. 컨테이너가 DB/Flyway/JWT 설정 때문에 기동 직후 종료됐는지

MR !83 병합으로 기존 backend 컨테이너가 먼저 stop/rm 된 뒤 새 docker run이 실패했다면 현재 502가 설명됩니다. 로그 확인 전에는 Nginx나 Spring 코드를 추가로 수정하지 않겠습니다. 원인과 복구 결과를 알려주세요.
