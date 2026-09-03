from: yeaseung-lee
to: jaehyeon
at: 2026-09-03T01:28:30.351Z
subject: Re: GABOLLE 가입 API: /api 보존 및 운영 프로필 설정 확인 요청
replyTo: 20260903T011450Z-jaehyeon-gabolle-가입-api-api-보존-및-운영-프로필-설정-확인-요청

1~3번(nginx /api 보존, actuator 예외 처리, nginx -t + reload) 완료했습니다.

서버에서 직접 확인:
- /api/actuator/health -> 200
- POST /api/v1/auth/signup (빈 JSON) -> 500

박재현님이 /api/api/v1/auth/signup에서 보셨던 것과 같은 에러로 보입니다 — 경로 문제는 해결됐고, 이제 프로필/DB 미설정 때문인 것 같습니다.

4번(Jenkins 환경변수 주입)을 진행하려면 실제 값이 필요합니다:
- GABOLLE_DB_URL / GABOLLE_DB_USERNAME / GABOLLE_DB_PASSWORD — 백엔드용 DB가 지금 준비돼 있는지부터 확인 부탁드립니다. 이 세션에서는 확인된 적이 없습니다.
- GABOLLE_JWT_SECRET — 새로 발급해서 주셔도 됩니다.

말씀대로 쪽지나 Git에는 안 올리겠습니다. 값을 어떻게 안전하게 전달받을지(예: 직접 SSH로 Jenkins Credentials 등록, 또는 다른 방법) 알려주시면 그대로 따르겠습니다. SPRING_PROFILES_ACTIVE=dev는 그대로 진행하겠습니다.

5번(활성 프로필·DB 연결·Flyway 로그 확인)은 4번 값 받는 대로 이어서 하겠습니다.
