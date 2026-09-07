from: jaehyeon
fromEmail: masdf13@naver.com
to: ahwlstjd57
at: 2026-09-07T06:32:19.373Z
subject: [회귀·정정] !293 에 순서 명시가 빠져 AuthException 이 500 — MR !299 로 고쳤습니다 (님 파일, 선점 후 작업)

모진성 님, 배포 살아난 뒤 확인하다가 **회귀 하나를 찾았습니다. !293 에 한 줄이 빠졌습니다.** MR !299 로 고쳤고, 님 파일(`GlobalAuthExceptionHandler`)이라 먼저 선점하고 작업했습니다 — 이견 있으시면 되돌리겠습니다.

## 증상 (배포 `d7c9710` 에서 실측)

| 요청 | 나와야 하는 것 | 실제 |
| --- | --- | --- |
| 없는 이메일로 로그인 | 401 `INVALID_CREDENTIALS` | **500 `INTERNAL_ERROR`** |
| 소셜 티켓 오류 | 400 `OAUTH_TICKET_INVALID` | **500 `INTERNAL_ERROR`** |

로그인 화면에 "이메일 또는 비밀번호가 올바르지 않습니다" 대신 서버 오류가 뜹니다. 잠금(429)·이메일 미인증(403)·중복 가입(409)도 같은 자리를 지나니 전부 500 입니다.

## 원인 — 님 진단의 반대쪽 절반입니다

`AuthExceptionHandler` 를 `assignableTypes` 로 좁힌 것은 맞습니다. 그런데 그 advice 에는 **`@ExceptionHandler(Exception.class)` 캐치올이 그대로 남아 있고**, `AuthController` 에는 계속 적용됩니다. `AuthException` 핸들러는 `GlobalAuthExceptionHandler` 로 옮겨졌습니다.

Spring 의 `ExceptionHandlerExceptionResolver` 는 **advice 단위로** 순서대로 훑어 "그 예외를 처리할 메서드가 있는 첫 advice" 에서 멈춥니다. advice 들 사이에서 더 구체적인 타입을 고르는 것이 아닙니다. `Exception` 은 `AuthException` 을 매칭하니, `AuthExceptionHandler` 가 먼저 오면 거기서 끝나고 전역 advice 는 시도조차 안 됩니다. 둘 다 `@Order` 가 없어 순서가 빈 등록 순서에 달려 있었습니다.

즉 님이 고친 것(스코프 없는 캐치올이 **다른 도메인** 예외를 가로채던 것)은 해결됐고, **같은 캐치올이 이제 auth 자기 도메인의 `AuthException` 을 가로채는 것**이 남았습니다. 컨테이너 로그가 그대로 보여줍니다.

```
ERROR AuthExceptionHandler : 인증 요청 처리 중 예기치 않은 오류가 발생했습니다.
com.gabolle.backend.auth.service.AuthException: 소셜 로그인 절차가 만료됐어요...
```

## 고친 것

`GlobalAuthExceptionHandler` 에 `@Order(Ordered.HIGHEST_PRECEDENCE)` 한 줄. 캐치올은 그대로 뒀습니다 — 진짜 예기치 않은 예외는 계속 500 이어야 하고 그것도 테스트로 고정했습니다. `!293` 을 되돌리지 않았습니다.

`AuthExceptionRoutingTest` 3건을 새로 만들어 **두 advice 를 함께 등록해** 순서를 고정합니다. `@Order` 를 지우면 2건이 빨개지는 것을 확인했습니다. 전체 빌드 622개 통과.

## 그리고 님 500 버그 건 — 결론이 바뀝니다

앞 쪽지에서 "!293 이 그 500 도 같이 고친다" 고 했는데 **틀렸습니다. 정정합니다.** `RecommendationJobController` 요청에는 이제 auth advice 가 안 붙으니 그쪽 `IllegalStateException` → 400 은 제대로 나올 겁니다. 그건 맞습니다. 다만 제가 근거로 든 "캐치올이 사라졌다" 는 사실이 아니고, 캐치올은 auth 컨트롤러 안에 남아 있었습니다. 제약 없는 여행 500 은 !293 배포 뒤 다시 재보시면 400 이 나올 것으로 봅니다 — !299 까지 올라간 뒤에 재보시는 게 확실합니다.

## 곁들여 — 가입 중복이 409 가 아니라 400 입니다

같은 확인 중에 본 것입니다. 이미 가입된 이메일로 `POST /auth/signup` 을 부르면 `409 EMAIL_ALREADY_EXISTS` 가 아니라 `400 INVALID_REQUEST`(fields 비어 있음)가 옵니다. `fields` 가 비어 있으니 `MethodArgumentNotValidException` 이 아니라 `HttpMessageNotReadableException` 쪽으로 보이고, `LocalSignupRequest` 에 **생성자가 둘**(전체 + 6인자 축약)이라 Jackson 이 어느 것을 쓸지 못 정하는 것이 의심됩니다. 확인은 안 했고 추정입니다. `-698` 안에 넣으실지 별도로 볼지 정해 주시면 제가 파도 됩니다 — 지금은 손대지 않았습니다.
