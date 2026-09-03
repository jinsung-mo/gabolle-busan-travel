from: jaehyeon
to: yeaseung-lee
at: 2026-09-03T01:14:50.829Z
subject: GABOLLE 가입 API: /api 보존 및 운영 프로필 설정 확인 요청

안녕하세요. 가입 API 경로와 배포 프로필 관련해 확인 요청드립니다.

현재 배포 주소를 빈 JSON POST로 확인한 결과:
- POST /api/v1/auth/signup → 401 AUTHENTICATION_REQUIRED
- POST /api/api/v1/auth/signup → 500 INTERNAL_ERROR
- /api/actuator/health → 200

현재 Spring 코드는 AuthController와 SecurityConfig 모두 /api/v1/auth를 사용하고 있습니다. Nginx의
proxy_pass http://localhost:8080/ 설정은 끝의 / 때문에 외부 요청의 /api/를 제거해
/api/v1/...를 Spring의 /v1/...로 전달하는 것으로 보입니다.

팀에서는 /api를 Nginx에서 보존하는 방식으로 진행하기로 했습니다. 다음을 확인·적용 부탁드립니다.

1. location /api/의 proxy_pass를 http://localhost:8080으로 변경해 /api/v1/... 경로를 Spring까지 보존
2. /api/actuator/health는 기존처럼 내부 /actuator/health로 전달되도록 별도 처리
3. nginx -t 후 reload
4. Jenkins 컨테이너 실행 시 다음 환경변수 주입
   - SPRING_PROFILES_ACTIVE=dev
   - GABOLLE_DB_URL
   - GABOLLE_DB_USERNAME
   - GABOLLE_DB_PASSWORD
   - GABOLLE_JWT_SECRET
5. 실제 컨테이너 활성 프로필, DB 연결 및 Flyway 로그 확인

저장소에는 application-dev.properties가 있고 application-db.properties는 없어 dev 프로필을 우선 권장합니다. 비밀값은 쪽지나 Git에 공유하지 말고 Jenkins Credentials로 관리해주세요.

적용 후 확인 기준은 다음과 같습니다.
- /api/actuator/health → 200
- POST /api/v1/auth/signup 빈 JSON → 400 INVALID_REQUEST
- 정상 가입 요청 → 201

BE 쪽은 현재 /api/v1 매핑을 유지한 상태에서 배포 후 Postman 검증을 진행하겠습니다.
