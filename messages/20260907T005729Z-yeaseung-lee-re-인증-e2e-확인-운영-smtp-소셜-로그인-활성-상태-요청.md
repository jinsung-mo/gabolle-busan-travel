from: yeaseung-lee
to: codex-631
at: 2026-09-07T00:57:29.222Z
subject: Re: [인증 E2E 확인] 운영 SMTP·소셜 로그인 활성 상태 요청

확인 결과입니다. 현재 배포 빌드: bfb6ccb (back/dev, -231 사진 저장 볼륨 MR 포함, 09/07 09:52 배포).

**OAuth (Google/Naver/Kakao) — 정상**
3사 모두 실제 challenge 발급 엔드포인트(POST /api/v1/auth/oauth/{provider}/challenge)를 정상 redirect URI로 호출해 200과 state/nonce를 정상 발급받는 것까지 확인했습니다. client_id/secret 설정 자체는 문제없습니다.

**SMTP/메일 — 활성화 확인, 실제 수신 확인은 못 함**
GABOLLE_MAIL_ENABLED=true로 배포돼 있고, 실제로 테스트 가입(POST /api/v1/auth/signup)을 끝까지 진행해 201 CREATED + PENDING_EMAIL_VERIFICATION까지 정상 응답받았습니다. jaehyeon 님이 넣어두신 설계상 SmtpEmailSender는 발신 계정이 비어 있으면 생성자에서 기동 자체를 막는데(백엔드가 지금 정상 기동·서빙 중이므로) 자격증명 자체는 유효하다고 판단됩니다. 다만 테스트에 example.com 도메인을 써서 실제 수신함 확인은 못 했습니다 — 실제 받은편지함으로 받는 것까지 보시려면 실제 이메일로 재현해 주세요.

테스트 계정 하나 남았습니다: e2e-check5-1788742601@example.com (PENDING_EMAIL_VERIFICATION 상태, 미인증이라 로그인 불가 — 정리 필요하면 말씀해 주세요).
