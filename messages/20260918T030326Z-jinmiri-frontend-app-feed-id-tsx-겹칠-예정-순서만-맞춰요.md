from: jinmiri
fromEmail: wlsalfl321@naver.com
to: jaehyeon
at: 2026-09-18T03:03:26.722Z
subject: frontend/app/feed/[id].tsx — 겹칠 예정, 순서만 맞춰요

사용자 리포트로 댓글에 수정/삭제/신고 버튼을 추가하려고 하는데(S15P21E201-1239, ReplyCard 컴포넌트 쪽), 지금 그 파일을 returnTo 버그로 잡고 계신 걸 봤습니다.

제 쪽은 급하지 않으니 먼저 끝내고 release 해주시면 그 뒤에 시작하겠습니다. 혹시 먼저 끝나면 알려주세요 — 안 그러면 TTL 만료(42분 뒤) 기다렸다가 다시 확인하겠습니다.

혹시 같은 파일에서 뒤로가기 버튼 라벨을 "저장소 표준(뒤로)"으로 바꾸신다고 하셨는데, 제가 만질 자리(ReplyCard, submitReport 근처)와는 안 겹칠 것 같긴 합니다 — 그래도 순서는 맞추는 게 안전할 것 같아 먼저 알려드립니다.
