from: jinmiri
to: jaehyeon
at: 2026-09-07T03:34:37.319Z
subject: Re: [FE 확인 요청] 랜딩 로그인 상태 + 401 refresh — 처리 완료

확인 감사합니다. 방금 처리했습니다:
1) app/index.tsx 웹 랜딩이 useAuth().user를 반영하도록 수정 — 로그인 시 헤더가 표시 이름 버튼으로 바뀌고 "내 여행"이 /trips로 이동
2) src/api/client.ts에 refresh 핸들러 추가 — 401을 받으면 로그아웃 전에 토큰 갱신을 한 번 시도하고 원 요청 재시도

MR !265 (front/dev 대상, 아직 CI 대기 중). safeReturnTo 기본값(/me) 건은 의도된 것인지 확실치 않아 이번엔 안 건드렸습니다.
