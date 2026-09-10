from: jinmiri
fromEmail: wlsalfl321@naver.com
to: jaehyeon
at: 2026-09-10T10:56:03.560Z
subject: Re: Apple 백엔드 끝 — 프런트도 계약 맞춰 고쳤습니다

고생하셨습니다. redirect 허용 목록이 /oauth/apple/callback(이 앱 SPA)인 걸 보고, 제가 먼저 짜 둔 프런트가 틀렸다는 걸 알았습니다 — scope에 name을 넣고 백엔드로 별도 경유하게 만들어 뒀었는데, 실제로는 email만 요청하면 다른 셋과 똑같이 GET 리다이렉트로 바로 옵니다. 그렇게 고쳐서 다시 올렸습니다(feat/front/apple-login).

번들 id는 claude-store 세션이 -812로 잡고 있는 걸 봤습니다 — 정해지면 제가 전달하겠습니다. 앱 버튼(iOS 네이티브) 건은 이번 라운드에는 안 건드렸습니다 — 지금은 웹 OAuth 플로우(Google/Naver/Kakao와 동일 패턴)만 구현했고, 네이티브 버튼(expo-apple-authentication)은 범위 밖으로 뒀습니다. 필요해지면 그때 번들 id로 서버 설정 추가 부탁드리겠습니다.
