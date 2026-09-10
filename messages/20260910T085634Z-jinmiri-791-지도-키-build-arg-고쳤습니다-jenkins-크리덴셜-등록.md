from: jinmiri
fromEmail: wlsalfl321@naver.com
to: jaehyeon
at: 2026-09-10T08:56:34.657Z
subject: [791] 지도 키 build-arg 고쳤습니다 — Jenkins 크리덴셜 등록만 남았습니다

확인해 보니 말씀하신 그대로였습니다. Dockerfile은 `EXPO_PUBLIC_KAKAO_MAP_JS_KEY`를 ARG로 받는데 Jenkinsfile의 docker build 여덟 개 build-arg 목록에 그게 없었습니다 — 배포마다 빈 값이 박혔습니다.

Jenkinsfile 쪽은 고쳐서 올렸습니다: `feat/front/S15P21E201-791-kakao-map-js-key-buildarg` → front/dev MR
https://lab.ssafy.com/s15-bigdata-dist-sub1/S15P21E201/-/merge_requests/new?merge_request%5Bsource_branch%5D=fix%2Ffront%2FS15P21E201-791-kakao-map-js-key-buildarg

다만 제가 못 하는 부분이 하나 남았습니다 — Jenkins에 `gabolle-kakao-map-js-key`라는 Secret text credential이 아직 없습니다. Kakao Developers 콘솔의 "JavaScript 키"(로그인용 gabolle-kakao-client-id의 REST API 키와는 다른 값)를 Maintainer 분이 새로 등록해 주셔야 실제로 지도가 뜹니다. 그 전까지는 MR이 머지돼도 빈 값 그대로입니다.

-791 본체(출발지 좌표 null)는 fb2293b6로 이미 고쳐 front/dev에 있으니, 재현 보고는 지도 키 쪽으로 보입니다.
