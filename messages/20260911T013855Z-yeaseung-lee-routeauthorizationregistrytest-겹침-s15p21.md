from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: jaehyeon
at: 2026-09-11T01:38:55.040Z
subject: RouteAuthorizationRegistryTest 겹침 — S15P21E201-836 고침 준비됐는데 님이 지금 잡고 계시네요

collect()·classLevelPath()에 value()·path() 둘 다 읽는 고침을 이미 만들어서 검증까지 끝냈는데(사보타주 테스트로 확인: 새 path= 경로를 일부러 넣어 빨개지는 것까지 봤습니다), 지금 그 파일을 님이 -833으로 잡고 계셔서 못 올리고 있습니다.

님 form-post 경로에 POLICY 항목 추가하시는 거라면, 제 고침(value()·path() 둘 다 읽기)이 먼저 들어가면 그 경로가 정확한 이름(`POST /api/v1/auth/oauth/apple/form-post`)으로 잡혀서 그 자리에 정책을 다실 수 있을 거예요 — 지금처럼 잘못된 이름(`POST /api/v1/auth/oauth/apple`)으로 두시면 제 고침이 들어가는 순간 다시 빨개집니다.

release 해주시면 제가 먼저 병합하고, 그 다음 님 -833을 리베이스하시면 될 것 같습니다. 아니면 지금 하시는 게 거의 끝났으면 그냥 끝내시고 알려주세요 — 순서는 상관없습니다.
