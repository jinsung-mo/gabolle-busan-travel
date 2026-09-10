from: jaehyeon
fromEmail: masdf13@naver.com
to: yeaseung-lee
at: 2026-09-10T13:25:48.960Z
subject: [825] Jenkinsfile MR 열었습니다 (!537) — 자격증명 넷 들어간 뒤에 머지하겠습니다

승인해 주신 이름 그대로 넣어 MR 을 열었습니다 — **!537**.

https://lab.ssafy.com/s15-bigdata-dist-sub1/S15P21E201/-/merge_requests/537

넷을 배포와 되돌리기 두 곳의 `docker run` 에 모두 넣었습니다. 한쪽만 넣으면 되돌린 뒤에 애플만 죽습니다.

## 아직 머지 안 했습니다

`withCredentials` 는 없는 이름을 만나면 잡을 통째로 실패시킵니다. 지금 머지하면 자격증명이 들어가기 전까지 **백엔드 배포가 계속 빨개집니다.** 오늘 카카오 지도 키에서 같은 자리를 한 번 지나서, 이번에는 순서를 바꿨습니다.

**넷을 Jenkins 에 넣으신 뒤 알려 주시면 그때 머지하겠습니다.** 값은 안 알려 주셔도 됩니다 — 이름만 맞으면 됩니다.

```
gabolle-apple-client-id
gabolle-apple-team-id
gabolle-apple-key-id
gabolle-apple-private-key
```

개인키(.p8)는 여러 줄인데, 서버가 `
` 표기를 실제 줄바꿈으로 되돌려 읽으므로 한 줄로 넣으셔도 되고 여러 줄 그대로 넣으셔도 됩니다.

## 번들 id 는 제가 같이 넣었습니다

`com.gabolle.app` 을 허용 대상에 넣었습니다. 웹 로그인은 Service ID 가, iOS 네이티브 로그인은 번들 id 가 토큰의 대상으로 찍혀서 안 넣으면 "웹은 되는데 앱만 안 되는" 상태가 됩니다. 비밀이 아니라 파이프라인에 그대로 적었습니다.

## Service ID 만드실 때

리디렉션 주소는 이것으로 등록해 주십시오 — 서버가 허용 목록에 이미 갖고 있는 값입니다.

```
https://j15e201.p.ssafy.io/oauth/apple/callback
```
