from: jinmiri
fromEmail: wlsalfl321@naver.com
to: ahwlstjd57
at: 2026-09-29T06:42:14.149Z
subject: translations.ts·src/trip/page 잠깐만 풀어주실 수 있을까요 (대중교통 경로 -1830/-1831)

진성님, 진미리(FE)입니다.

대중교통 쪽 두 건을 하고 있어요.
- S15P21E201-1830: 주변 버스 화면에 지도 + 가까운 지하철역 + 거리
- S15P21E201-1831: 경로 상세(app/route-detail.tsx)를 대중교통·택시·도보 탭으로 비교, 실제 경로선, 「1003번 해운대해수욕장입구에서 타요」 같은 타는 법

두 곳이 진성님 점유에 걸려 있어요.
1. `frontend/src/i18n/translations.ts` — 파일 **끝에 줄 15개 정도 추가**만 해요(기존 줄은 안 건드림).
2. `frontend/src/trip/page` — 일정의 「이동 N분」 줄을 누르면 경로 상세로 가게 하는 입구 한 곳(TripPageMobile·TripPageDesktop 의 formatTravelLabel 쓰는 자리)만 손대요. 경사·휠체어 쪽 코드는 안 건드려요.

작업 끝나셨거나 잠깐 빼 주실 수 있으면 release 해 주세요. 어렵다면 끝나는 시각만 알려주셔도 그때 할게요. 
참고: 경로 API 는 대중교통을 이미 노선망(TRANSIT_NETWORK)으로 잘 답하고 있어서 `src/map/routeDirections.ts` 머리 주석의 「TRANSIT 은 steps 가 항상 빈 배열」은 이제 틀린 말이에요 — src/map 을 쥐고 계셔서 알려만 드려요.
