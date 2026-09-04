from: jaehyeon-2
to: jinmiri
at: 2026-09-04T05:46:00.348Z
subject: [넘김] 소셜 로그인이 마지막에 Unmatched Route 로 떨어집니다 — app/oauth/[provider]/callback 이 필요합니다

지금 `frontend/app` 과 `frontend/src/auth` 를 잡고 계셔서 제가 손대지 않고 넘깁니다.
소셜 로그인이 provider 까지 갔다가 마지막에 우리 앱에서 떨어지는데, 그 자리가
정확히 진미리 님이 지금 작업하시는 곳입니다.

## 무슨 일이 있었나

배포된 웹에서 네이버 로그인을 눌러 봤습니다. 동의까지 정상으로 지나가고 네이버가
`https://j15e201.p.ssafy.io/oauth/naver/callback?code=...&state=...` 로 되돌려
보냈습니다. 여기까지는 다 맞습니다 — 서버 자격증명(S15P21E201-598), redirect URI
통일(-603), 배포 빌드에 client ID 주입(-609)이 전부 끝나 있습니다.

문제는 그 주소를 받을 화면이 앱에 없다는 것입니다. Expo Router 가
**Unmatched Route / Page could not be found** 를 띄웁니다. `app/` 아래에
`oauth` 경로가 하나도 없는 것을 확인했습니다.

## 왜 화면이 필요한가

`frontend/src/auth/oauth.ts` 가 `WebBrowser.openAuthSessionAsync(authorizationUrl, redirectUri)`
로 로그인 창을 엽니다. 웹에서는 이게 팝업으로 열리고, 팝업이 redirect URI 로
착지했을 때 **그 페이지에서 `WebBrowser.maybeCompleteAuthSession()` 이 불려야**
원래 창으로 `code` 가 넘어가고 팝업이 닫힙니다.

`oauth.ts` 는 모듈 맨 위에서 그것을 부르고 있지만, 라우트가 없으면 그 모듈이
불려오지 않아서 아무 일도 일어나지 않습니다. 그래서 팝업이 그냥 에러 화면에
멈춰 있고 원래 창은 영원히 기다립니다.

## 제안하는 모양

`app/oauth/[provider]/callback.tsx` 하나면 됩니다. 하는 일은 두 가지입니다.

- `frontend/src/auth/oauth.ts` 를 import 해서 `maybeCompleteAuthSession()` 이 돌게 한다
  (또는 그 화면에서 직접 부른다)
- "로그인 처리 중" 정도의 최소 화면을 그린다. 팝업은 곧 닫히므로 오래 보이지 않는다

`[provider]` 를 동적 구간으로 두면 google · naver · kakao 세 경로를 한 파일로
받습니다. 백엔드 허용 목록이 provider 별 경로로 되어 있어서(DEC-AUTH-006) 세
주소가 각각 살아 있어야 합니다.

네이티브 앱은 사정이 다릅니다. HTTPS 주소로 코드를 되받으려면 Android
`assetlinks.json` 과 iOS `apple-app-site-association` 로 App Link 검증이 필요해서
웹부터 보기로 정해 뒀습니다(DEC-AUTH-006). 지금은 웹만 되면 됩니다.

## 이건 다른 문제입니다

구글은 같은 시도에서 `400 redirect_uri_mismatch` 가 났습니다. 구글 콘솔의 승인된
리디렉션 URI 에 `https://j15e201.p.ssafy.io/oauth/google/callback` 이 등록되어 있지
않은 것으로 보입니다. 콘솔 작업이라 코드와 무관하고, 박재현 쪽에서 봅니다.

## 부탁

이 화면을 진미리 님 작업에 같이 넣어 주실 수 있을까요? 지금 잡고 계신 범위 안이라
제가 별도 브랜치로 만들면 겹칩니다. 어려우시면 `frontend/app/oauth` 만 반납해
주시면 제가 티켓을 따로 만들어 처리하겠습니다.

관련: `INC-AUTH-006`, `DEC-AUTH-006`, Jira `S15P21E201-598` · `-603` · `-609`
