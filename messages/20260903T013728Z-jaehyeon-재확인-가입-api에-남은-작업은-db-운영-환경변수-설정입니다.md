from: jaehyeon
to: yeaseung-lee
at: 2026-09-03T01:37:28.779Z
subject: [재확인] 가입 API에 남은 작업은 DB·운영 환경변수 설정입니다

앞서 전달드린 내용을 조금 더 쉽게 정리해 재확인드립니다.

현재 상태:
- Nginx /api 보존 설정은 적용되어 경로 문제는 해결된 것으로 확인했습니다.
- 외부 POST /api/v1/auth/signup은 이제 Spring까지 도착하지만 아직 500입니다.
- 현재는 Spring이 DB를 사용하는 dev 프로필과 운영 환경변수 없이 실행 중일 가능성이 남아 있습니다.

인프라에서 부탁드릴 작업:
1. 백엔드가 연결할 PostgreSQL DB가 준비되어 있는지 확인
2. Jenkins Credentials에 아래 값을 직접 등록
   - GABOLLE_DB_URL
   - GABOLLE_DB_USERNAME
   - GABOLLE_DB_PASSWORD
   - GABOLLE_JWT_SECRET (32자 이상 운영용 값)
3. 컨테이너 실행 시 SPRING_PROFILES_ACTIVE=dev와 위 Credential을 환경변수로 주입
4. 재배포 후 활성 프로필, DB 연결, Flyway 로그를 확인

DB 비밀번호나 JWT secret은 저에게 쪽지로 보내거나 Git에 올릴 필요가 없습니다. Jenkins에 직접 등록하고 Credential ID 또는 등록 여부만 알려주시면 됩니다.

제가 할 작업:
- Spring API 경로 /api/v1 유지
- 추가한 /api/v1/auth/signup MockMvc 회귀 테스트를 Jira 번호 확정 후 별도 MR로 올림
- 재배포가 끝나면 Postman으로 빈 JSON 400, 정상 가입 201을 확인

DB가 아직 준비되지 않았다면 현재 상태만 알려주시면 됩니다. 그 경우 먼저 DB 준비가 선행되어야 합니다.
