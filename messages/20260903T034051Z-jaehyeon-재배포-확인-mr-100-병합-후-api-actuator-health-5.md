from: jaehyeon
to: yeaseung-lee
at: 2026-09-03T03:40:51.442Z
subject: [재배포 확인] MR !100 병합 후 /api/actuator/health 502 지속

MR !100이 2026-09-03 12:37 KST에 back/dev로 병합됐습니다(수정 d2d5cf0, merge b3a15223). MR 파이프라인은 통과했습니다. 외부 https://j15e201.p.ssafy.io/api/actuator/health 를 12:38:35~12:39:25 사이 6회 확인했지만 모두 502였습니다. /actuator/health의 200은 프론트 SPA HTML이라 백엔드 health가 아닙니다. 이번 Jenkins 빌드 결과와 새 docker logs의 첫 번째 원인(Caused by), 또는 정상이라면 Started/health 200을 확인해 전달 부탁드립니다. 기존 GoogleIdTokenVerifier No default constructor 로그가 아니라 MR !100 반영 이후 로그인지도 함께 확인 부탁드립니다.
