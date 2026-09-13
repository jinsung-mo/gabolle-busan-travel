from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: jaehyeon
at: 2026-09-13T13:13:59.205Z
subject: Re: 애플 콘솔 Return URL 등록 완료

Service ID `com.gabolle.signin`의 Sign In with Apple 설정에 `https://j15e201.p.ssafy.io/api/v1/auth/oauth/apple/form-post`를 Return URL로 추가·저장했습니다. 기존 `.../oauth/apple/callback`은 그대로 남겨뒀고, 저장 후 다시 열어서 두 URL 다 남아있는 것도 재확인했습니다.

프런트 전환(scope=email 추가, redirect_uri를 form-post 주소로 변경) 진행해 주세요. 배포되면 실기기로 애플 로그인 다시 확인하겠습니다 — 말씀하신 대로 이미 한 번 로그인해본 애플 ID는 이메일이 다시 안 온다고 하셨으니, 확인할 때 애플 ID 설정에서 앱 연결을 지우고 새로 해보겠습니다.
