from: jaehyeon
fromEmail: masdf13@naver.com
to: all
at: 2026-09-11T01:29:38.985Z
subject: 인가 정책 감사에 구멍 — @PostMapping(path=...) 로 쓴 경로는 감사가 못 봅니다

`-833` 작업 중에 인가 정책 감사(`RouteAuthorizationRegistryTest`)에서 구멍 하나를 밟았습니다. 제 쪽은 우회해서 끝냈지만 검사 자체는 그대로라 알려 둡니다.

## 무엇

새 경로를 이렇게 썼습니다.

```java
@RequestMapping("/api/v1/auth/oauth/apple")   // 클래스
@PostMapping(path = "/form-post", consumes = ...)  // 메서드
```

감사는 이 경로를 `POST /api/v1/auth/oauth/apple/form-post` 가 아니라 **`POST /api/v1/auth/oauth/apple`** 로 봤습니다. `collect` 가 애너테이션의 `value()` 만 읽는데 저는 `path =` 에 넣었기 때문입니다. 둘은 별칭이라 스프링에게는 같은 값이고, 그 검사에게는 아닙니다.

## 왜 문제인가

이번에는 **운 좋게 빨개졌습니다** — 잘못 잡힌 경로 이름이 표에 없어서 "정책 없는 경로가 있다" 로 걸렸습니다.

그런데 **클래스 경로가 이미 표에 있는 컨트롤러라면 조용히 통과합니다.** 예를 들어 `@RequestMapping("/api/v1/auth")` 인 컨트롤러에 `@GetMapping(path = "/whatever")` 를 더하면, 감사는 그것을 이미 표에 있는 `/api/v1/auth` 로 보고 넘어갑니다. 즉 **정책을 적지 않은 새 경로가 감사를 통과합니다.** 이 검사의 목적이 정확히 그것을 막는 것인데요.

`SecurityAllowlistMatchesRoutesTest` 도 같은 `discoverRoutes` 를 쓰므로 같이 눈이 멉니다.

## 고치는 방법

`collect` 에서 `value()` 가 비면 `path()` 를 읽으면 됩니다. 다섯 갈래(`Get`·`Post`·`Put`·`Patch`·`Delete`) 전부 같습니다.

```java
value = a.value().length == 0 ? a.path() : a.value();
```

`@RequestMapping` 의 클래스 경로를 읽는 `classLevelPath` 도 같은 모양입니다.

**제 MR 에서 고치지 않았습니다.** 남의 검사를 제 MR 에서 고치면 그 변경이 지금까지 안 보였던 다른 경로를 새로 드러낼 수 있고, 그러면 제 티켓과 무관한 이유로 파이프라인이 빨개집니다. 고치는 쪽이 `path=` 로 숨어 있던 경로를 한 번에 확인하는 편이 맞다고 봤습니다.

`-788`(전 경로 인가 자동 점검)이 예승 님 것이라 그쪽에 붙이는 것이 자연스러워 보입니다. 티켓을 새로 만들까요, 아니면 예승 님이 그 티켓에 이어서 보시겠습니까? 말씀만 주시면 제가 만들어 두겠습니다.

당장은 **새 경로를 쓸 때 `@PostMapping("/x")` 처럼 value 자리에 두시면** 감사가 제대로 봅니다.
