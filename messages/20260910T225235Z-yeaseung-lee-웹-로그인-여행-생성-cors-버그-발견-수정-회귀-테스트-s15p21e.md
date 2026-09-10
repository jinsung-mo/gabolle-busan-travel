from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: masdf13, jinmiri
at: 2026-09-10T22:52:35.648Z
subject: 웹 로그인·여행 생성 CORS 버그 발견/수정 + 회귀 테스트 (S15P21E201-775/781)

에픽 S15P21E201-773(QA 테스트 전략) 마무리하면서 Playwright로 실제 브라우저 로그인→여행 생성 흐름을 처음 자동화하다가 실제 프로덕션 버그를 찾아 고쳤습니다.

**버그** — `SecurityConfig.java`의 CORS(브라우저가 다른 출처로 보내는 요청을 서버가 명시적으로 허용해야 하는 규칙) 허용 헤더 목록에 `X-Session-Token`·`Idempotency-Key`가 빠져 있어서, 웹에서 로그인·여행 생성이 **전부** 막혀 있었습니다. 네이티브 앱은 이 규칙 자체를 안 받아서 지금까지 안 보였습니다. 증상이 고약했습니다 — `fetch()`가 HTTP 상태 코드 없이 그냥 실패해서 화면엔 "서버에 연결할 수 없어요"로만 보이고, 진짜 원인(CORS)은 브라우저 콘솔을 직접 열어야만 보입니다.

**고침** — back/dev에 머지 완료(MR !565). `jinmiri`님의 `client.ts`가 실제로 보내는 헤더 목록과 `SecurityConfig.java` 허용 목록을 대조해서 잡았습니다.

**추가한 안전망**
- `jaehyeon`님이 손댄 적 있는 `SecurityConfig.java`의 허용 목록이 이번처럼 또 어긋나면(S15P21E201-704가 실제로 겪은 사고와 같은 계열 — 허용 목록과 컨트롤러 매핑이 서로 다른 파일이라 git이 조용히 어긋나게 합침) `OAuthChallengeJourneyFunctionalTest`가 실제 HTTP로 잡습니다. `MockMvc`는 이런 종류를 못 잡아서 `FunctionalJourneyTest`(진짜 소켓+필터체인) 기반으로 새로 만들었습니다.
- `frontend/tests/e2e/core-journey.spec.ts`(Playwright)가 실제 브라우저로 로그인~추천 요청까지 매 스케줄(front/dev, 매일 09:10 KST)마다 검증합니다. `client.ts`에 새 헤더를 추가하실 일이 있으면 `SecurityConfig`의 허용 목록도 같이 맞춰야 이 테스트가 안 빨개집니다.

참고로 두 파일 다 CORS 허용 목록과 실제 요청 헤더가 서로 다른 파일에 있다는 게 근본 원인이었습니다 — 다음에 헤더를 하나라도 추가하실 때는 반대쪽도 같이 봐 주시면 좋겠습니다.
