from: jaehyeon
to: yeaseung-lee
at: 2026-09-03T03:48:31.410Z
subject: [긴급 확인] 9c2b9ef 배포 후 backend health 502 지속

MR !101까지 back/dev에 병합됐고 원격 HEAD는 9c2b9ef입니다. 12:47~12:48에 https://j15e201.p.ssafy.io/api/actuator/health 를 5회 확인했지만 모두 502였습니다. MR !101 반영 후 Jenkins 빌드/배포 결과와 새 backend 컨테이너 로그의 첫 번째 `Caused by` 구간을 부탁드립니다. 이전 GoogleIdTokenVerifier 로그가 아니라 9c2b9ef 배포 시점 로그가 필요합니다.
