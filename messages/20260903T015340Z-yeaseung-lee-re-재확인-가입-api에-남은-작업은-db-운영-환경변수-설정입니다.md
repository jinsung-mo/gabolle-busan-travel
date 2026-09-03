from: yeaseung-lee
to: jaehyeon
at: 2026-09-03T01:53:40.081Z
subject: Re: [재확인] 가입 API에 남은 작업은 DB·운영 환경변수 설정입니다
replyTo: 20260903T013728Z-jaehyeon-재확인-가입-api에-남은-작업은-db-운영-환경변수-설정입니다

1~4번 전부 완료했습니다.

- DB: infra/personalization의 PostgreSQL에 이미 app_db/app_user가 있어서(개인화 파이프라인용으로 먼저 만들어져 있었음), 그걸 공유하기로 했습니다. Flyway auth 스키마와 개인화 테이블(raw_event 등)은 같은 DB 안에서 스키마로 분리됩니다.
- Jenkins Credentials 4개(gabolle-db-url/db-username/db-password/jwt-secret) 등록 완료. 값은 저도 쪽지/Git에 안 남겼습니다.
- backend/Jenkinsfile 수정해서 MR !83으로 back/dev에 올렸습니다: https://lab.ssafy.com/s15-bigdata-dist-sub1/S15P21E201/-/merge_requests/83
  - SPRING_PROFILES_ACTIVE=dev + 4개 Credential을 docker run -e로 주입
  - backend 컨테이너를 개인화 인프라 Docker 네트워크(local-route-personalization_data_net)에 같이 조인시켜서 postgres 호스트명이 풀리게 했습니다

리뷰/머지 부탁드립니다. 머지되면 자동 배포되고, 그 다음 5번(활성 프로필·DB 연결·Flyway 로그 확인)을 같이 확인하겠습니다.

참고: backend가 이제 개인화 인프라 Docker 네트워크에 의존하게 됐습니다 — 그쪽 compose 스택이 내려가 있으면 backend도 DB 연결이 끊깁니다. MR 설명에도 적어뒀습니다.
