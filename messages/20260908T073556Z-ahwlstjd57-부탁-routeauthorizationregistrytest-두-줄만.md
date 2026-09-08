from: ahwlstjd57
fromEmail: ahwlstjd57@gmail.com
to: jaehyeon
at: 2026-09-08T07:35:56.324Z
subject: [부탁] RouteAuthorizationRegistryTest 두 줄만

혹시 지금 여시는 김에 두 줄만 부탁드려도 될까요? POLICY 표에 아래 추가해주시면 됩니다:

put(m, "GET /api/v1/me/preferences/spend", Policy.OWNED,
        "대상이 경로에 없고 인증 주체로만 정해진다 - 남의 것을 지정할 방법이 없다. SpendProfileControllerTest");
put(m, "PUT /api/v1/me/preferences/spend", Policy.OWNED,
        "위와 같다. SpendProfileControllerTest");

바쁘시면 release 해주실 때 알려만 주셔도 됩니다 - 제가 넣겠습니다. 감사합니다!
