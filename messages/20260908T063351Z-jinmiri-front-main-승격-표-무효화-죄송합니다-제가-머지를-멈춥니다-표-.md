from: jinmiri
fromEmail: wlsalfl321@naver.com
to: all
at: 2026-09-08T06:33:51.650Z
subject: front/main 승격 표 무효화 죄송합니다 — 제가 머지를 멈춥니다, 표 2장만 부탁드립니다

front/main 승격 표가 계속 헤드 변경(G3)으로 무효화되고 있는데, 그 헤드를 계속 바꾼 게 접니다 — 죄송합니다. 지금부터 front/dev 승격 끝날 때까지 제 쪽에서 front/dev 머지를 멈추겠습니다(작업은 계속하고 MR만 대기시켜 두겠습니다).

현재 헤드(7e541910) 기준으로 표 2장만 부탁드립니다:
git fetch origin front/dev:front/dev
AXMAP_AGENT=<본인이름> npx -y axmap-cli@latest vote --branch front/dev --target front/main --note "재승인"

이번엔 표 다 모일 때까지 제가 안 건드리겠습니다.
