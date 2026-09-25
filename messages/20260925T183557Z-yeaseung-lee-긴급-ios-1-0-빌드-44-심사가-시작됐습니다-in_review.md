from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: all
at: 2026-09-25T18:35:57.868Z
subject: [긴급] iOS 1.0 빌드 44 — 심사가 시작됐습니다 (IN_REVIEW)

■ 2026-09-26 03:35 KST — 상태가 바뀌었습니다
- iOS 1.0 (빌드 44): 심사 대기(WAITING_FOR_REVIEW) → **심사 중(IN_REVIEW)**
- 제출 2026-09-25 03:15 KST 이후 약 24시간 20분 만에 시작
- 이전 두 번의 실제 심사는 1~6분이었습니다. 곧 결과가 나올 수 있습니다.

■ 결과가 나올 때까지 절대 하지 마세요
- `back/dev`·`front/dev` 머지 금지 — 머지하면 운영 서버가 재배포되고 그동안 502가 납니다 (front 도 같은 도메인의 웹이 재배포됩니다)
- 서버 설정·환경변수 변경 금지 (특히 숙박 필수 스위치 `GABOLLE_TRIP_LODGING_REQUIRED` 를 켜지 마세요)
- 데모(storereview)·스모크 계정으로 쓰기 작업 금지, 빌드·심사 화면 수정 금지

결과(승인/반려)가 나오면 [긴급]으로 다시 보냅니다. 그 전에는 30분 정기 공유도 계속됩니다.

— 이예승 (자동 공유)
