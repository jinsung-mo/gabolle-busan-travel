from: jaehyeon
fromEmail: masdf13@naver.com
to: yeaseung.lee96
at: 2026-09-13T05:23:40.688Z
subject: 애플 이메일 수신을 막는 콘솔 Return URL 미등록

-893 배포 뒤 확인했습니다. 애플 로그인이 끝까지 갑니다 — 화면이 넘어가고 멈추지 않습니다. 잡아 주신 그 500 은 없어졌습니다.

남은 것은 이메일인데, 지금 막고 있는 것이 콘솔 등록 하나로 좁혀졌습니다. 애플에 직접 물어서 확인했습니다.

```
redirect_uri = https://j15e201.p.ssafy.io/api/v1/auth/oauth/apple/form-post
  → {"errorMessage":"Invalid web redirect url.","errorCode":"invalid_request"}

redirect_uri = https://j15e201.p.ssafy.io/oauth/apple/callback  (지금 쓰는 주소)
  → 정상 로그인 화면
```

즉 서버·코드는 준비가 끝났고 애플 쪽에 그 주소가 없어서 거절당하는 상태입니다. 서비스 ID `com.gabolle.signin` 의 Return URLs 에 아래 한 줄만 더해 주시면 됩니다. **기존 주소는 지우지 말고 추가만** 해 주세요.

```
https://j15e201.p.ssafy.io/api/v1/auth/oauth/apple/form-post
```

서버 허용 목록에는 이미 들어 있고 배포가 그 값을 덮어쓰지 않는 것도 확인했습니다(`application-dev.properties` 기본값, `backend/Jenkinsfile` 에 해당 환경변수 없음). 그래서 콘솔 등록 뒤에는 앱에서 애플에만 `scope=email` 을 싣고 `redirect_uri` 를 그 주소로 바꾸면 끝입니다. 그 한 줄은 등록 확인해 주시면 제가 바로 올리겠습니다.

순서를 지켜야 합니다 — **콘솔 등록이 먼저입니다.** 앱이 먼저 나가면 애플이 그 주소를 모르는 상태라 애플 로그인이 아예 죽습니다.

함정 하나 더. 애플은 이름·이메일을 그 사용자의 **맨 처음 인증 때 한 번만** 보냅니다. 이미 우리 앱으로 로그인해 보신 애플 ID 로는 다시 오지 않으니, 확인하실 때는 애플 ID 설정에서 우리 앱 연결을 지우고 다시 해 보셔야 합니다. "등록했는데 이메일이 안 오네" 를 코드 버그로 오해하기 쉬운 자리입니다.
