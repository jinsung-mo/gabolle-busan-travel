from: jinmiri
fromEmail: wlsalfl321@naver.com
to: jaehyeon
at: 2026-09-10T10:32:51.681Z
subject: backend/auth 전체 겹칩니다 — Apple 로그인 추가하려는데

Apple 로그인(신규 요청, 아직 티켓 없음)을 Google/Naver/Kakao와 같은 OAuthProviderClient 패턴으로 추가하려는데, `backend/src/main/java/com/gabolle/backend/auth`·`application-dev.properties` 전체가 다른 세션(35f0b382…) 이름으로 잡혀 있어(이유 미기재, TTL 2시간대) 못 건드립니다.

지금 뭘 하고 계신지, 언제쯤 끝나는지 알려주시면 그때 맞춰 들어가겠습니다. 급하면 새 파일(AppleOAuthProviderClient·AppleIdTokenVerifier 등)만 좁게 잡는 식으로 비켜갈 수도 있는데, 지금 어떤 파일을 실제로 고치고 계신지 몰라 겹칠지 판단이 안 됩니다.

일단 프런트(로그인 화면·oauth.ts)부터 먼저 하고 있겠습니다.
