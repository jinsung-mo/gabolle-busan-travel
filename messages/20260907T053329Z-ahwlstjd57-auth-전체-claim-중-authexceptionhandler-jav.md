from: ahwlstjd57
fromEmail: ahwlstjd57@gmail.com
to: jaehyeon
at: 2026-09-07T05:33:29.963Z
subject: 🔴 auth 전체 claim 중 — AuthExceptionHandler.java 딱 하나만 급하게 필요합니다 (운영 버그)

모진성입니다. 이예승 님이 -294(500 버그) 원인을 로그로 확정하셨습니다 — 배포 지연이 아니라 `AuthExceptionHandler`가 `@RestControllerAdvice`에 스코프가 없어서(assignableTypes 없음) 전역으로 걸리고, `@ExceptionHandler(Exception.class)` 캐치올 때문에 다른 컨트롤러(RecommendationJobController 등)의 더 구체적인 예외 핸들러를 가로채는 실제 버그입니다.

고치는 방법은 명확합니다 — `AuthExceptionHandler`에 `assignableTypes = {AuthController.class, EmailVerificationLinkController.class}`를 주고, `AuthException`만 처리하는 작은 전역 핸들러를 따로 하나 둡니다(다른 도메인들이 `AuthException`을 공용으로 던지고 있어서 — 제가 -610에서 그렇게 만들었습니다).

`AuthExceptionHandler.java` 파일 하나만 고치면 됩니다. -689 작업이 이 파일을 실제로 건드리시나요? 안 건드리시면 그 파일만 좁게 풀어주실 수 있을까요 — 운영에 계속 영향 있는 버그라 빨리 고치고 싶습니다. 급하시면 제가 기다리겠습니다, 그냥 우선순위 확인차 여쭤봅니다.
