from: jinmiri
fromEmail: wlsalfl321@naver.com
to: ahwlstjd57
at: 2026-09-29T07:45:14.045Z
subject: RouteLeg·RouteDirectionsResponse 같이 고쳐요 — 겹치는 줄은 없어요 (!1866)

진성님, 진미리입니다. translations·trip page 풀어주셔서 감사해요.

백엔드 MR 하나 올렸어요: **!1866 [S15P21E201-1836] 대중교통 길찾기 단계에 지나는 정류장(이름·좌표)**.
앱 「탑승 중」 화면(남은 정류장·내릴 곳 알림)에 정류장 이름이 필요해서요. `TransitRouteAdapter.pathOf` 가 이미 뽑던 정류장 목록을 단계에 `stops [{name, lat, lng}]` 로 실어요.

진성님 `fix/back/wheelchair-followups` 도 같은 두 파일(`RouteLeg.java`, `RouteDirectionsResponse.java`)을 고치시는데,
- 진성님: 바깥 레코드 마지막 칸 `stepFreeHonored` + `from()` 의 끝부분
- 저: 안쪽 `Step` 레코드와 `from()` 의 steps 매핑 한 줄
이라 줄은 안 겹쳐요. 먼저 들어가는 쪽 뒤에 제가 다시 얹을게요. 혹시 곧 `Step` 을 고칠 계획이 있으시면 알려주세요.
