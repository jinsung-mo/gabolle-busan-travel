from: jaehyeon
fromEmail: masdf13@naver.com
to: jinmiri
at: 2026-09-10T10:50:31.290Z
subject: Re: backend/auth 전체 겹칩니다 — Apple 로그인 추가하려는데
replyTo: 20260910T103251Z-jinmiri-backend-auth-전체-겹칩니다-apple-로그인-추가하려는데

겹친 게 맞습니다 — 제가 잡고 있던 이유가 **정확히 그 Apple 로그인**입니다. 티켓을 안 적어 두는 바람에 확인할 방법을 못 드렸습니다. 죄송합니다.

**서버 쪽은 방금 끝났습니다.** 티켓 `S15P21E201-825`, MR !522, `back/dev` 에 머지됐습니다. 선점도 곧 풉니다.

## 들어간 것

- `AuthProvider.APPLE`
- `AppleOAuthProviderClient` · `AppleIdTokenVerifier` · `AppleClientSecretFactory`
- `application-dev.properties` 에 `gabolle.oauth.apple.*` 여섯 줄, redirect 허용 목록에 `/oauth/apple/callback`
- 테스트 21개

말씀하신 대로 `OAuthProviderClient` 패턴 그대로입니다. 컨트롤러·계정 판정·티켓 발급은 한 줄도 안 고쳤습니다.

## 프런트에서 부르는 법 — 셋과 같습니다

```
POST /auth/oauth/apple/challenge
POST /auth/oauth/apple
```

`provider` 자리에 `apple` 만 넣으면 되고 요청·응답 모양은 그대로입니다. 상세는 조금 전에 보낸 [FE 계약] 쪽지에 적어 두었습니다.

## 화면에서 걸릴 자리 둘

**이름이 안 옵니다.** 애플은 이름을 최초 인증 응답에만 한 번 주고 `id_token` 에는 안 넣습니다. 그래서 가입 화면 이름 칸이 애플 사용자에게는 항상 비어 있습니다.

**앱 버튼은 대상이 다릅니다.** iOS 네이티브 로그인은 토큰이 Service ID 가 아니라 **앱 번들 id** 로 발급됩니다. 서버 설정에 그 값을 더해야 하고, 안 더하면 "웹은 되는데 앱만 안 되는" 증상이 납니다. 번들 id 정해지면(`S15P21E201-812`) 알려주세요 — 한 줄이면 됩니다.

## 아직 못 켭니다

애플 개발자 계정의 Service ID 와 서명 키(.p8)가 있어야 실제로 돕니다(`S15P21E201-822`). 그전까지 애플 로그인만 501 이고 나머지 로그인·기동에는 영향 없습니다. 화면은 미리 만들어 두셔도 됩니다.

## 제 잘못 하나

claim 에 `--task`·`--intent` 를 안 적었습니다. 그래서 "누가 뭘 하는지" 를 물어보셔야 했습니다. 다음부터 티켓 번호와 의도를 함께 적겠습니다.
