from: jaehyeon
to: ahwlstjd57
at: 2026-09-04T04:05:18.361Z
subject: [확인 부탁] trip · itinerary 컨트롤러가 X-User-Id 헤더로 사용자를 정합니다 — 인가 우회가 됩니다

박재현입니다. 제가 place 도메인을 만들다가 인증 쪽을 다시 보게 됐는데, 진행 중이신 범위에서
하나 걸려서 알려 드립니다. 제가 손대지 않았고, 판단은 맡기겠습니다.

## 무엇이

`TripController` 64·67·90·92행과 `ItineraryEditController` 73·76행이 요청자를 인증 principal 이
아니라 `X-User-Id` **요청 헤더**로 정하고, 헤더가 없으면 문자열 `"usr_unknown"` 을 씁니다.

```java
@RequestHeader(value = "X-User-Id", required = false) String userId
String creator = userId != null ? userId : "usr_unknown";
```

## 왜 문제인가

`SecurityConfig` 56행이 `anyRequest().authenticated()` 라서 `/api/v1/trips` 는 이미 JWT 로 막혀
있습니다. 즉 **인증은 통과했는데 "누구인가" 만 클라이언트가 헤더로 주장**하는 상태입니다.
로그인한 A 가 `X-User-Id: <B 의 UUID>` 를 실어 보내면

- 생성은 B 소유로 만들어지고,
- 조회는 `TripQueryService` 44행의 멤버십 검사가 그 주장 값으로 돌아 무력화되며,
- `ItineraryEditService` 는 `created_by` 에 그 값을 그대로 적어서 편집 이력의 작성자가 위조됩니다.

API 명세서 2.1 절이 이걸 명시적으로 금지합니다 — "다른 회원의 ID 를 추측해도 조회·수정할 수
없어야 하며".

덧붙여 헤더가 아예 없으면 `"usr_unknown"` 이 `JpaTripRepository` 135행의 `UUID.fromString` 에
들어가 500 이 납니다. 프런트가 붙는 순간 첫 통합에서 바로 걸릴 자리입니다.

## 고치는 법

두 파일에서 한 줄씩입니다. `@RequestHeader("X-User-Id") String userId` 를 지우고
`Authentication authentication` 을 받아 `authentication.getName()` 을 쓰면 됩니다. 그 값이 JWT
`sub` 이고 사용자 UUID 문자열입니다. `TripMember.userId` 가 `String` 이라 타입도 그대로 맞습니다.

같은 코드가 `AuthController` 178행 `authenticatedUserId(Authentication)` 에 이미 있는데 private
이라 못 가져다 쓰십니다. 그래서 제가 재사용 가능한 형태로
`backend/src/main/java/com/gabolle/backend/common/security/AuthenticatedUsers.java` 에
`requireId(Authentication)` / `optionalId(Authentication)` 두 개를 만들어 뒀습니다
(브랜치 `feat/back/S15P21E201-462-place-domain`, 아직 MR 전입니다). 그쪽에서 쓰시기 편하실
겁니다. 제 place 컨트롤러들은 처음부터 그걸로 만들었습니다.

## 제가 안 한 이유

`trip` 과 `itinerary` 는 -461 · -313 으로 진행 중이시라 손대면 충돌합니다. 그리고 어제 같은
문제를 두 사람이 각자 고쳐서 세 번 부딪힌 일도 있었고요. 티켓을 새로 파서 제가 할지, 진행 중인
브랜치에 같이 넣으실지 알려 주시면 그대로 따르겠습니다.
