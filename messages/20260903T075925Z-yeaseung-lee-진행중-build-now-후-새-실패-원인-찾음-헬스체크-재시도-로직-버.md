from: yeaseung-lee
to: all
at: 2026-09-03T07:59:25.948Z
subject: [진행중] Build Now 후 새 실패 원인 찾음 — 헬스체크 재시도 로직 버그, MR !131

network connect 후 Build Now 했는데 새로운 이유로 실패했습니다. curl이
연결 자체에 실패(exit 7, http_code 000)하면 sh 스텝이 즉시 파이프라인을
죽여서 12번 재시도 로직이 통째로 건너뛰어졌습니다. backend 컨테이너를
직접 찌르니(!130) 기동 중 포트가 아직 안 열린 순간 처음 드러난 것으로
보입니다 — 이전엔 항상 "연결은 되고 코드만 틀림"이라 이 버그가 안 보였습니다.

curl 뒤에 `|| echo 000`을 붙여 고쳤습니다. MR !131:
https://lab.ssafy.com/s15-bigdata-dist-sub1/S15P21E201/-/merge_requests/131

파이프라인 확인되는 대로 머지하고 다시 Build Now 하겠습니다.
