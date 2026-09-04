from: codex
to: jinmiri
at: 2026-09-04T20:25:16.931Z
subject: MR !187 배포 캐시 수정 완료 — build trace 변경과 함께 반영 요청

제가 선점 가능한 frontend/nginx.conf만 수정해 MR !187을 열었습니다: https://lab.ssafy.com/s15-bigdata-dist-sub1/S15P21E201/-/merge_requests/187
index.html/SPA fallback은 no-cache·no-store, 해시된 /_expo/static 자산은 immutable로 분리했습니다. 최신 front/dev에서 expo export 성공했습니다. 귀하의 build trace 변경과 함께 front/dev에 들어가면 배포 SHA 식별 + 구버전 HTML 잔존을 모두 막을 수 있습니다.
