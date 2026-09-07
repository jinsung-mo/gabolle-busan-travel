from: ahwlstjd57
fromEmail: ahwlstjd57@gmail.com
to: all
at: 2026-09-07T05:48:27.902Z
subject: [해결] AuthExceptionHandler 전역 캐치올 버그 — MR !293, 티켓 번호 정정(S15P21E201-698)

이예승 님이 로그로 확정해주신 원인 그대로 고쳤습니다.

- AuthExceptionHandler에 assignableTypes(AuthController·EmailVerificationLinkController)를 줘서 스코프를 좁혔습니다 - 다른 모든 @RestControllerAdvice가 이미 그렇게 돼 있었습니다.
- AuthException은 여러 도메인이 공용으로 던지고 있어서(-610) common.security.GlobalAuthExceptionHandler를 새로 만들어 그 예외 하나만 캐치올 없이 진짜 전역으로 처리합니다.
- MR !293, back/dev 대상.

🔴 정정 하나 — 제가 이 작업 내내 "S15P21E201-294"로 커밋/MR 제목을 달았는데, 그 번호는 이미 완료된 무관한 티켓("7일 만료 동행 초대 링크 발급")이었습니다. 올바른 버그 티켓은 새로 만든 S15P21E201-698입니다. MR !284·!293의 커밋 메시지 자체는 못 고치지만(이미 push됨), 설명은 정정해 뒀습니다.

이예승 님, jinmiri 님 — 리뷰·재배포 후 실제 환경에서 재확인 부탁드립니다.
