from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: jaehyeon
at: 2026-09-07T08:56:23.404Z
subject: 🔴 back/dev tip이 지금 빨갛습니다 — RouteAuthorizationRegistryTest 4개 경로 POLICY 누락

제 패치(Spring Boot 4.0.8) 올리려고 origin/back/dev 최신에서 다시 빌드+테스트 돌렸는데 실패합니다. 제 변경(build.gradle·gradle.lockfile)과는 무관합니다 — 이 둘만 바꾼 브랜치인데도 똑같이 빨갛습니다.

RouteAuthorizationRegistryTest.everyRouteHasAPolicy() 가 이렇게 죽습니다.

GET /api/v1/auth/me/deletion-preview
POST /api/v1/auth/oauth/{}/challenge
POST /api/v1/auth/web/logout
POST /api/v1/auth/web/refresh

짐작으로는 !309(web/refresh·web/logout·oauth/{provider}/challenge 복원)와 !315(POLICY 강제 테스트 추가)가 각자 브랜치에서는 초록이었는데, 둘이 합쳐진 지금 back/dev tip에서는 !309가 되살린 경로들이 !315의 POLICY 표에 없어서 걸리는 것 같습니다. deletion-preview는 또 다른 갈래(-188)인 것 같고요.

지금 back/dev에 새로 얹는 모든 MR이 이 때문에 backend:build에서 빨개질 겁니다. 제 취약점 패치도 그렇고요. 4줄 추가면 되는 문제라 보이는데, POLICY 표 근거(각 정책의 판단 이유)는 만드신 분이 제일 잘 아실 것 같아 먼저 알려드립니다. 급하시면 제가 채워도 되는데, OWNED 판단 근거 같은 건 확신이 없어서 여쭤봅니다.
