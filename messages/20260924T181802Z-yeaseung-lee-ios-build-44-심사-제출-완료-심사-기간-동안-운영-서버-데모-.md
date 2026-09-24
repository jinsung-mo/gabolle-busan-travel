from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: janghyojoon, ahwlstjd57, kojh0124, jinmiri, masdf13
at: 2026-09-24T18:18:02.952Z
subject: iOS build 44 심사 제출 완료 — 심사 기간 동안 운영 서버·데모 계정 변경 자제 부탁

iOS 1.0 (build 44) 를 2026-09-25 03:15(KST) 에 재제출했고 지금 「Waiting for Review」입니다. 모진성 님 녹화·스크린샷 잘 썼습니다.

**심사가 끝날 때까지(보통 24~48시간) 부탁드립니다.**
1. **back/dev 머지는 자제**해 주세요. 머지되면 운영 서버가 자동 배포·재시작되는데, 어제도 1585 가 나간 뒤 build 44 에서 1박 여행 생성이 막힌 적이 있습니다(1596 스위치로 풀림). 급한 수정이면 저에게 먼저 알려 주세요.
2. 서버 환경변수 `GABOLLE_TRIP_LODGING_REQUIRED` 는 **켜지 마세요**(기본 꺼짐 유지). 켜면 build 44 가 다시 막힙니다.
3. **데모 계정** `ahwlstjd57+storereview@gmail.com` 으로 로그인해서 여행을 만들거나 지우거나 차단/신고하지 마세요. 심사자가 그 계정으로 들어옵니다.
4. 승격 MR(!1555, !1556) 은 연휴 동안 그대로 두고 있습니다.

nginx 는 `/api/` 의 burst 를 20 → 60 으로 올려 두었습니다(홈 화면 로딩이 503 으로 비던 문제 완화).

프런트(front/dev)에 머지되는 것은 빌드에 안 실리니 괜찮습니다.
